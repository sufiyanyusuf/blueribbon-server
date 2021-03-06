
const { Model } = require('objection');
const { DBErrors } = require('objection-db-errors');

const knex = require('../knex')

Model.knex(knex)

class Modifier extends Model {
  static get tableName() {
    return 'Modifiers';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        id: {type: 'integer'},
        title: {type: 'string'},
        description: {type: 'string'},
        type: {type: 'string'},
        order: {type: 'integer'},
        listing_id: {type: 'integer'},
        element_type: {type: 'string'},
      }
    };
  }

  static get relationMappings() {

    const listings = require('./listing');
    const choices = require('./modifierChoices');
    const stepper = require('./stepperElement');
    const textField = require('./textfieldElement');
    const multiOption = require('./multiOptionsElement');

    return{
        listing:{
            relation: Model.BelongsToOneRelation,
            modelClass:listings,
            join:{
                from : 'Modifiers.listing_id',
                to : 'Listings.id'
            }
        },

        choice:{
            relation: Model.HasManyRelation,
            modelClass:choices,
            join:{
                from : 'Modifiers.id',
                to : 'Modifier_Choices.modifier_id'
            }
        },

        stepper:{
            relation: Model.HasOneRelation,
            modelClass:stepper,
            join:{
                from : 'Modifiers.id',
                to : 'Elements_Steppers.modifier_id'
            }
        },

        textField:{
            relation: Model.HasOneRelation,
            modelClass:textField,
            join:{
                from : 'Modifiers.id',
                to : 'Elements_Textfields.modifier_id'
            }
        },

        multiOption:{
            relation: Model.HasOneRelation,
            modelClass:multiOption,
            join:{
                from : 'Modifiers.id',
                to : 'Elements_Multi_Options.modifier_id'
            }
        }

    }

  }

}

module.exports = Modifier;