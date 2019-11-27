
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class Subscriptions extends Model {
  static get tableName() {
    return 'User_Subscriptions';
  }

  static get relationMappings() {
    // Importing models here is a one way to avoid require loops.
    const purchase = require('./purchase');

    return{
        purchase:{
          relation: Model.HasManyRelation,
          modelClass:purchase,
          join:{
              from : 'User_Subscriptions.id',
              to : 'Purchases.subscription_id'
          }
        }
    }

  }

}

module.exports = Subscriptions;