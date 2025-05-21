export type TSMSResponse = {
  statusInfo: {
    statusCode: string;
    errordescription: "Success" | "Failure";
    clienttransid: string;
    serverReferenceCode: string;
  };
};
