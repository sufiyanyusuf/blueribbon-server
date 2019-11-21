
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class SubscriptionState extends Model {
  static get tableName() {
    return 'Subscription_States';
  }

  static get relationMappings() {
    // Importing models here is a one way to avoid require loops.
    const subscription = require('./subscription');

    return{
      subscription:{
        relation: Model.HasOneRelation,
        modelClass:subscription,
        join:{
            from : 'Subscription_States.subscription_id',
            to : 'User_Subscriptions.id'
        }
      }
    }

  }

}

module.exports = SubscriptionState;