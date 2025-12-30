import { PERMISSIONS } from "../const/permission.const";

const isPermitted = (
  permissions?: { _id: string; name: string }[],
  requiredPermission?: string
) => {
  const neededPermission = requiredPermission
    ? requiredPermission
    : PERMISSIONS.SUPER_ADMIN;
  if (permissions?.length) {
    return permissions.some(
      (p) => p.name === PERMISSIONS.SUPER_ADMIN || p.name === neededPermission
    );
  }
  return false;
};

export default isPermitted;
