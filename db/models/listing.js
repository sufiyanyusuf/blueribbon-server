
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class Listing extends Model {
  static get tableName() {
    return 'Listings';
  }
  static get relationMappings() {
    
    const productInfo = require('./productInfo');
    return{
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