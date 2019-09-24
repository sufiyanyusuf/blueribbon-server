
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class TextField extends Model {
  static get tableName() {
    return 'Elements_Textfields';
  }

  static get relationMappings() {

    const modifier = require('./modifier');

    return{
        modifier:{
            relation: Model.BelongsToOneRelation,
            modelClass:modifier,
            join:{
                from : 'Elements_Textfields.modifier_id',
                to : 'Modifiers.id'
            }
        }
    }

  }

}

module.exports = TextField;