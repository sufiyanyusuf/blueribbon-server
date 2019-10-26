
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class UserAddress extends Model {

  static get tableName() {
    return 'User_Addresses';
  }

}

module.exports = UserAddress;