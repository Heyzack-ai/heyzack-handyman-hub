export interface Handyman {
    availability: Availability[]
    availability_status: string
    bank_details: BankDetail[]
    contact_number: string
    creation: string
    current_location: string
    docstatus: number
    doctype: string
    email: string
    handyman_name: string
    id: string
    modified: string
    modified_by: string
    name: string
    owner: string
    service_area: number
    skills: string
    kyc_document: string
    profile_image: string
    is_verified: number
    rating: string
    completedJobs: number
    partner: string
    phone: string
  }
  
  export interface Availability {
    creation: string
    day: string
    docstatus: number
    doctype: string
    end_time: string
    idx: number
    is_active: number
    modified: string
    modified_by: string
    name: string
    owner: string
    parent: string
    parentfield: string
    parenttype: string
    start_time: string
  }
  
  export interface BankDetail {
    account_holder_name: string
    bank_name: string
    bic_code: string
    creation: string
    docstatus: number
    doctype: string
    iban_number: string
    idx: number
    is_default: string
    modified: string
    modified_by: string
    name: string
    owner: string
    parent: string
    parentfield: string
    parenttype: string
    type: string
  }