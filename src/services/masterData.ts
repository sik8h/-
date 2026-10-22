export interface Consignment {
  name: string;
  phone: string;
  location?: string;
}

export interface MasterStore {
  code: string;
  name: string;
  phone: string;
  location?: string;
  defaultItem?: string;
  carrierSpec?: string;
  category: string;
  consignments?: Consignment[];
}

export const INITIAL_MASTER_STORES: MasterStore[] = [
  {
    code: "성광건해",
    name: "성광건해",
    phone: "010-4094-0000",
    category: "건어물",
    consignments: [
      { name: "오지다건해", phone: "010-4094-0000", location: "가락몰 건어물동" }
    ]
  }
];
