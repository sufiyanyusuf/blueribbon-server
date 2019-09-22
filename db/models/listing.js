
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class Listing extends Model {
  static get tableName() {
    return 'Listings';
  }
  static get relationMappings() {
    // Importing models here is a one way to avoid require loops.
    const organizations = require('./organization');
    const productInfo = require('./productInfo');
    return{
        listings:{
            relation: Model.BelongsToOneRelation,
            modelClass:organizations,
            join:{
                from : 'listings.organization_id',
                to : 'organizations.id'
            }
        },
        productInfo:{
          relation:Model.HasOneRelation,
          modelClass:productInfo,
          join:{
            from:'Listings.id',
            to:'ProductInfo.listing_id'
          }
        }

    }

  }
}

module.exports = Listing;