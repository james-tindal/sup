
class Model {}

namespace Model {
  export class User implements Model {
    created_at: string
    updated_at: string

    phone_number: string
    bio: string
    image_url?: string
    otp_valid_from?: string
    otp_checked?: string

    constructor({created_at, updated_at, phone_number, bio, image_url, otp_valid_from}) {
      this.created_at = created_at
      this.updated_at = updated_at
    
      this.phone_number = phone_number
      this.bio = bio
      this.image_url = image_url
      this.otp_valid_from = otp_valid_from
    }
  }
  
}

interface Repository<Model> {
  model: Model
}

export class User implements Repository<Model.User> {
  model: Model.User

  constructor(model: Model.User) {
    this.model = model
  }
}

