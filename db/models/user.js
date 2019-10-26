
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class User extends Model {
  static get tableName() {
    return 'Users';
  }

  static get relationMappings() {
    
    const User_Addresses = require('./userAddress');
    
    return{
        users:{
            relation: Model.HasManyRelation,
            modelClass:User_Addresses,
            join:{
                from : 'Users.id',
                to : 'User_Addresses.user_id'
            }
        }
    }
  }

}

module.exports = User;