
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class Listing extends Model {
  static get tableName() {
    return 'Listings';
  }
  static get relationMappings() {
    
    const productInfo = require('./productInfo');
    const modifer = require('./modifier');
    const organization = require('./organization');
    const subscription = require('./subscription');

    return{
      productInfo:{
        relation:Model.HasOneRelation,
        modelClass:productInfo,
        join:{
          from:'Listings.id',
          to:'ProductInfo.listing_id'
        }
      },
      modifier:{
        relation:Model.HasManyRelation,
        modelClass:modifer,
        join:{
          from:'Listings.id',
          to:'Modifiers.listing_id'
        }
      },
      organization:{
        relation:Model.BelongsToOneRelation,
        modelClass:organization,
        join:{
          from:'Listings.organization_id',
          to:'Organizations.id'
        }
      },
      subscription: {
        relation:Model.HasManyRelation,
        modelClass:subscription,
        join:{
          from:'Listings.id',
          to:'User_Subscriptions.listing_id'
        }
      }
    }

  }
}

module.exports = Listing;