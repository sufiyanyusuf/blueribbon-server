
const turf = require('@turf/turf')
const { point,polygon } = require('@turf/helpers');

const ServiceLocation = require('../../db/models/serviceLocation');

const verifyCoordinateInAreas = async (listing_id, coordinate) => {
    
    var pt = point(coordinate);
    
    return new Promise (async (resolve, reject) => {
        try {

            const areas = await ServiceLocation
            .query()
            .where('listing_id', listing_id);
    
            areas.map((area) => {
                if (area.polygon.data) {
                    const polygonData = area.polygon.data;
                    const _polygon = polygonData.map((coordinate) => {
                        return [coordinate.lat, coordinate.lng];
                    });
                    var poly = polygon([_polygon]);
                    if (turf.booleanPointInPolygon(pt, poly)) {
                        resolve(true);
                    }
                }
            })

            resolve(false)

        }catch (e){
            reject (e.error);
        }
    })
    
}

module.exports = verifyCoordinateInAreas;