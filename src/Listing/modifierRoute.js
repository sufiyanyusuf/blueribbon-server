const express = require('express');
const ModifierRouter = express.Router();

const Modifier = require('../../db/models/modifier');
const Choice = require('../../db/models/modifierChoices');
const Stepper = require('../../db/models/stepperElement');
const TextField = require('../../db/models/textfieldElement');
const MultiOptions = require('../../db/models/multiOptionsElement');

ModifierRouter.route('/create').post(async function (req, res) {

    const newModifier = {
        title:req.body.title,
        description:req.body.description,
        type:req.body.type,
        order:req.body.order,
        listing_id:req.body.listing_id
    };

    const getTextField = () => {
        if (req.body.element_type && req.body.element_type == 'textField') {
            const newTextfield = {
                element_type:'textField',
                placeholder:req.body.placeholder
            };
            return newTextfield;
        }
    }

    const getCarousel = () => {
        if (req.body.element_type && req.body.element_type == 'carousel') {
            const newCarousel = {
                element_type:'carousel',
                mandatory:req.body.mandatory,
                multi_selection:req.body.multi_selection,
            };
            return newCarousel
        }
    }

    const getMultiOptions = () => {
        if (req.body.element_type && req.body.element_type == 'multiOptions') {
            const newMultiOptions = {
                element_type:'multiOptions',
                mandatory:req.body.mandatory,
                multi_selection:req.body.multi_selection,
            };
            return newMultiOptions
        }
    }


    const getChoices = () => {
        if (req.body.choices && req.body.choices.length>0) {
            const choices = req.body.choices.map((choice)=>{
                const newChoice = {
                    order:choice.order,
                    title:choice.title,
                    pricing_impact:choice.pricing_impact,
                    icon:choice.icon,
                    image:choice.image,
                    default_selection:choice.default_selection
                };
                return newChoice;
            });
            return choices
        }
    }

    const getStepper = () => {
        if (req.body.element_type == 'stepper') {
            const newStepper = {
                max_value:req.body.maxValue,
                min_value:req.body.minValue,
                step_value:req.body.stepValue,
                price_multiplier:req.body.price_multiplier,
                unit_title:req.body.unit_title
            };
            return newStepper;
        }
    }

    try{
        const modifier = await Modifier.query().insert(newModifier);
        
        if (getStepper()){
            const stepper = await modifier
            .$relatedQuery('stepper')
            .insert(getStepper());
        }
        
        res.send({modifier});
    }catch(e){
        console.error(e);
    }

});

module.exports = ModifierRouter;