
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class ProductInfo extends Model {
  static get tableName() {
    return 'ProductInfo';
  }
  static get relationMappings() {
    // Importing models here is a one way to avoid require loops.
    const listings = require('./listing');

    return{
        listing:{
          relation: Model.BelongsToOneRelation,
          modelClass:listings,
          join:{
              from : 'productInfo.listing_id',
              to : 'listing.id'
          }
        }
    }
  }
}

module.exports = ProductInfo;