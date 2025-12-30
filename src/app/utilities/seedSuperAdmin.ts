import mongoose from "mongoose";
import config from "../config/config";
import { PERMISSIONS, permissionList } from "../const/permission.const";
import { Address } from "../modules/userManagement/address/address.model";
import { Admin } from "../modules/userManagement/admin/admin.model";
import { Permission } from "../modules/userManagement/permission/permission.model";
import { ROLES } from "../modules/userManagement/user/user.const";
import { User } from "../modules/userManagement/user/user.model";
import { createAdminOrStaffId } from "../modules/userManagement/user/user.util";
import { consoleLogger } from "./logger";

const checkAndCreatePermissions = async (session: mongoose.ClientSession) => {
  const existingPermissions = await Permission.find({}, null, {
    session,
  }).lean();
  const existingNames = existingPermissions.map((p) => p.name);

  const permissionsToCreate = permissionList
    .filter((name) => !existingNames.includes(name))
    .map((name) => ({ name }));

  if (permissionsToCreate.length > 0) {
    await Permission.insertMany(permissionsToCreate, { session });
    consoleLogger.info(
      `✅ Created missing permissions: ${permissionsToCreate.map((p) => p.name).join(", ")}`
    );
  }

  const superAdminPermission = await Permission.findOne(
    { name: PERMISSIONS.SUPER_ADMIN },
    null,
    { session }
  );
  if (!superAdminPermission) {
    throw new Error(
      "❌ Super admin permission not found after creating permissions!"
    );
  }

  return superAdminPermission;
};

const createSuperAdmin = async () => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const superAdminPermission = await checkAndCreatePermissions(session);

    const existingSuperAdmin = await User.findOne(
      { role: ROLES.SUPER_ADMIN },
      null,
      { session }
    );
    if (existingSuperAdmin) {
      consoleLogger.info("✅ Super admin already exists.");
      return;
    }

    const userId = await createAdminOrStaffId(false);
    if (!userId) throw new Error("❌ Failed to create super admin user ID!");

    const [admin] = await Admin.create(
      [
        {
          uid: userId,
          fullName: config.fullName,
        },
      ],
      { session }
    );

    const [address] = await Address.create(
      [
        {
          uid: userId,
          fullAddress: config.fullAddress,
        },
      ],
      { session }
    );

    await User.create(
      [
        {
          uid: userId,
          phoneNumber: config.phoneNumber,
          email: config.email,
          password: config.password,
          role: ROLES.SUPER_ADMIN,
          admin: admin._id,
          address: address._id,
          permissions: [superAdminPermission._id],
          status: "active",
        },
      ],
      { session }
    );

    consoleLogger.info("✅ Super admin created successfully.");
  } catch (error) {
    await session.abortTransaction();
    consoleLogger.error(
      "❌ Transaction failed. Super admin creation aborted!",
      error
    );
    throw error;
  } finally {
    await session.commitTransaction();
    await session.endSession();
  }
};

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.DBUrl as string);
    consoleLogger.info("✅ Connected to MongoDB");
  } catch (error) {
    consoleLogger.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

const seedSuperAdmin = async (): Promise<void> => {
  try {
    await connectDB();
    await createSuperAdmin();
    process.exit(0);
  } catch (error) {
    consoleLogger.error("❌ Error during super admin seeding:", error);
    process.exit(1);
  }
};

// eslint-disable-next-line no-undef
if (require.main === module) {
  // Only run if executed directly
  seedSuperAdmin();
}

export default seedSuperAdmin;
