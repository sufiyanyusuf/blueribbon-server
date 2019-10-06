
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class ServiceLocation extends Model {
  static get tableName() {
    return 'ServiceLocations';
  }

  static get relationMappings() {
    
    const listings = require('./listing');

    return{
        listing:{
            relation: Model.BelongsToOneRelation,
            modelClass:listings,
            join:{
                from : 'ServiceLocation.listing_id',
                to : 'listing.id'
            }
        }
    }

  }
}

module.exports = ServiceLocation;