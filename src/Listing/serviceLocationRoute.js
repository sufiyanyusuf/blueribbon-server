const express = require('express');
const ServiceLocationRouter = express.Router();

var serviceLocations = require('../assets/serviceLocations_uae');

const turf = require('@turf/turf')
const { point,polygon } = require('@turf/helpers');

const ServiceLocation = require('../../db/models/serviceLocation');

ServiceLocationRouter.route('/:listing_id/verifyCoordinates').get(async function (req, res) {
    let listing_id = parseInt(req.params.listing_id)
    var pt = point([req.body.lat, req.body.long]);

    try{

        const areas = await ServiceLocation
                                        .query()
                                        .where('listing_id', listing_id);
                     
                                      
        areas.map((area,index) =>{

            if (area.polygon.data){

                const polygonData = area.polygon.data
                const _polygon = polygonData.map((coordinate) => {
                    return [coordinate.lat,coordinate.lng]
                })

                var poly = polygon([_polygon]);
                if (turf.booleanPointInPolygon(pt, poly)){
                    res.json({'status':true,'attempt':index})
                }

            }

        })

        res.json({'status':false})

    }catch(e){
        res.json(e);
    }


});

ServiceLocationRouter.route('/:listing_id').get(async function (req, res) {

    let listing_id = parseInt(req.params.listing_id)
    console.log(listing_id);
    try{

        const areas = await ServiceLocation
                                        .query()
                                        .where('listing_id', listing_id);
                     
        res.json(areas);

    }catch(e){
        console.log(e);
        res.json(e);
    }

});

ServiceLocationRouter.route('/update').post ( async function (req, res) {

    const getLocations = () => {
        if (req.body.areas && req.body.areas.length>0 && req.body.listing_id) {
            const areas = req.body.areas.map((area)=>{
                const newServiceLocation = {
                    label:area.label,
                    data_id:area.data_id,
                    polygon:{data:area.polygon},
                    listing_id:req.body.listing_id
                }; 
                return newServiceLocation;
            });
            return areas
        }else{
            return []
        }
    }

    try{
        if (getLocations().length > 0){
            
            const listing_id = getLocations()[0].listing_id
        
            const numDeleted = await ServiceLocation
                                            .query()
                                            .delete()
                                            .where('listing_id', listing_id);
    
            const serviceLocations = await ServiceLocation
                                            .query()
                                            .insert(getLocations());  
                                                               
            res.json(serviceLocations);
        }else{
            if (req.body.listing_id){
                const numDeleted = await ServiceLocation
                                            .query()
                                            .delete()
                                            .where('listing_id', req.body.listing_id);
            }
            res.sendStatus(200)
        }
        

    }catch(e){
        console.log(e);
        res.json(e);
    }

});

ServiceLocationRouter.route('/search/:query').get (async function (req, res) {
    
    try {

        let keywords = req.params.query;
 
        var areas= serviceLocations.filter(function(item){

            // var name0 = item.properties.NAME_0; //load json for country
            var name1 = item.properties.NAME_1; //city
            var name3 = item.properties.NAME_3; //area
            if ((name3 && name3.toLowerCase().includes(keywords.toLowerCase()))
                ||(name1 && name1.toLowerCase().includes(keywords.toLowerCase()))
            ){
                return item
            }         
        });
    
        const polygons = areas.map((area)=>{
            return area.geometry.coordinates[0][0]
        })
    
        var gPolygonArray = polygons.map (coordinateSet => {
            return coordinateSet.map(coordinate => {
                return {lat:coordinate[1],lng:coordinate[0]}
            })
        })
    
        const formattedArray = areas.map((area,index) => {
            var label = ''
           
            if (area.properties.NAME_3){
                label = area.properties.NAME_3
            }else if (area.properties.NAME_2){
                label = area.properties.NAME_2
            }else{
                label = area.properties.NAME_1
            }
    
            return {
                label:label,
                value:area.id,
                key:area.id,
                data_id:area.id,
                polygon:gPolygonArray[index],    
            }
        })
    
        res.status(200).json({areas:formattedArray});

    }catch(e){
        res.status(404);
    }
    
});



module.exports = ServiceLocationRouter;