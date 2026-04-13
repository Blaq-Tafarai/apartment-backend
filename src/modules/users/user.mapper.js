'use strict';

/**
 * User data mapper - hide sensitive data
 */
class UserMapper {
  static toPublic(user) {
    if (!user) return null;
    
    const { password, ...publicUser } = user;
    return publicUser;
  }

  static toList(users) {
    return users.map(this.toPublic);
  }

  static toResponse(user, includeCompany = true) {
    const data = this.toPublic(user);
    
    if (includeCompany && data.company) {
      data.company = {
        id: data.company.id,
        uid: data.company.uid,
        name: data.company.name,
      };
      delete data.companyId;
    }
    
    return data;
  }
}

module.exports = UserMapper;

