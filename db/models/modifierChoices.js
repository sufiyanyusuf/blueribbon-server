
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class ModifierChoice extends Model {
  static get tableName() {
    return 'Modifier_Choices';
  }

  static get relationMappings() {

    const modifier = require('./modifier');

    return{
        modifier:{
            relation: Model.BelongsToOneRelation,
            modelClass:modifier,
            join:{
                from : 'Modifier_Choices.modifier_id',
                to : 'Modifiers.id'
            }
        }
    }

  }

}

module.exports = ModifierChoice;