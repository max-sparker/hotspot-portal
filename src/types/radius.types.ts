export interface RadiusUser {
  username: string;
  password: string;
  session_timeout?: number;
  idle_timeout?: number;
}

export interface RadiusSession {
  username: string;
  callingstationid: string;
  nasipaddress: string;
  acctstarttime: Date;
  acctsessiontime: number;
  acctinputoctets: number;
  acctoutputoctets: number;
}
