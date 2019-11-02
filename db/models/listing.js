
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
      }
    }

  }
}

module.exports = Listing;