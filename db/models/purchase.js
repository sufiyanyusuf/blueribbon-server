
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class Purchases extends Model {
  static get tableName() {
    return 'Purchases';
  }

  static get relationMappings() {
    // Importing models here is a one way to avoid require loops.
    const subscription = require('./subscription');

    return{
      subscription:{
        relation: Model.BelongsToOneRelation,
        modelClass:subscription,
        join:{
            from : 'Purchases.subscription_id',
            to : 'User_Subscriptions.id'
        }
      }
    }

  }

}

module.exports = Purchases;