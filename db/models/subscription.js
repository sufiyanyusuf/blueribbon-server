
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class Subscriptions extends Model {
  static get tableName() {
    return 'User_Subscriptions';
  }

  static get relationMappings() {
    // Importing models here is a one way to avoid require loops.
    const Purchase = require('./purchase');
    const SubscriptionState = require('./subscriptionState')
    const Listing = require('./listing')

    return{
      purchase:{
        relation: Model.HasManyRelation,
        modelClass:Purchase,
        join:{
            from : 'User_Subscriptions.id',
            to : 'Purchases.subscription_id'
        }
      },
      states: {
        relation: Model.HasManyRelation,
        modelClass:SubscriptionState,
        join:{
            from : 'User_Subscriptions.id',
            to : 'Subscription_States.subscription_id'
        }
      },
      currentState: {
        relation: Model.HasOneRelation,
        modelClass:SubscriptionState,
        join:{
            from : 'User_Subscriptions.current_state',
            to : 'Subscription_States.id'
        }
      },
    }

  }

}

module.exports = Subscriptions;