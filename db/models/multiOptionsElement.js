
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class MultiOption extends Model {
  static get tableName() {
    return 'Elements_Multi_Options';
  }

  static get relationMappings() {

    const modifier = require('./modifier');

    return{
        modifier:{
            relation: Model.BelongsToOneRelation,
            modelClass:modifier,
            join:{
                from : 'Elements_Multi_Options.modifier_id',
                to : 'Modifiers.id'
            }
        }
    }

  }

}

module.exports = MultiOption;