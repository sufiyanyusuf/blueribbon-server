
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
        relation: Model.HasOneRelation,
        modelClass:subscription,
        join:{
            from : 'Purchases.purchase_id',
            to : 'User_Subscriptions.purchase_id'
        }
      }
    }

  }

}

module.exports = Purchases;