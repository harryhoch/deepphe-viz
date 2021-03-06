'use strict';

/**
 * Module dependencies.
 */

// Load the full build of lodash
// Differences between core build and full build: https://github.com/lodash/lodash/wiki/Build-Differences
const _ = require('lodash');

// For writing debugging JSON into file
const fs = require('fs');

// Add methods to DataProcessor.prototype
class DataProcessor {
    
    /////////////////////////////////////////////////////////////////////////////////////////
    //
    //                            COHORT
    //
    ////////////////////////////////////////////////////////////////////////////////////////

    static getCohortData(neo4jRawArr) {
        let self = this;
        let stagesJson = {};
        stagesJson.stagesInfo = [];
        // Sort uniquePatientsArr by patient age of first encounter
        stagesJson.patients = _.sortBy(neo4jRawArr, 'firstEncounterAge');
        // Get all unique stages
        let uniqueStages = [];
 //      console.log('This is the original array');
//        console.log(neo4jRawArr);
  //      console.log("**********************************");
        console.log("This is the new array");

//        console.log(stagesJson.patients);
      
        for (let i = 0; i < neo4jRawArr.length; i++) {
            let stagesArr = neo4jRawArr[i].stages.forEach(function(stage) {
                let shortStageName = self.getShortStageName(stage);
                

                // Any shortStageName that is not in the order list, will be ignored.
                if (self.getOrderedCancerStages().indexOf(shortStageName) !== -1 && uniqueStages.indexOf(shortStageName) === -1) {
                    uniqueStages.push(shortStageName);
                }
                
            }); 
           // console.log('orginal stage name:' + stagesArr);
           // console.log('updated stage name:' + shortStageName); 
        }

        // Sort the uniqueCancerFactRelnArr by the item's index in the order array
        let sortedUniqueStages = this.sortByProvidedOrder(uniqueStages, this.getOrderedCancerStages());

        // Aggregate patients of each stage
        let stagesInfo = [];
        sortedUniqueStages.forEach(function(stage) {
            let obj = {};
            obj.stage = stage;
            obj.patients = [];
            obj.ages = [];

        
            const topLevelStages = {
                'Stage 0': ['Stage 0'],
                'Stage I': ['Stage I', 'Stage IA', 'Stage IB', 'Stage IC'],
                'Stage II': ['Stage II', 'Stage IIA', 'Stage IIB', 'Stage IIC'],
                'Stage III': ['Stage III', 'Stage IIIA', 'Stage IIIB', 'Stage IIIC'],
                'Stage IV': ['Stage IV', 'Stage IVA', 'Stage IVB', 'Stage IVC'],
                'Stage Unknown': ['Stage Unknown']
            };

            // Top level stage should also contain all patients from sub-leve stages
            if (Object.keys(topLevelStages).indexOf(stage) !== -1) {
                for (let i = 0; i < neo4jRawArr.length; i++) {
                    let patient = neo4jRawArr[i];
                    patient.stages.forEach(function(s) {
                        let shortStageName = self.getShortStageName(s);
                        // Use lodash's _.findIndex() instead of the native indexOf() to avoid duplicates
                        if ((topLevelStages[stage].indexOf(shortStageName) !== -1) && (_.findIndex(obj.patients, patient) === -1)) {
                            obj.patients.push(patient);
                        }
                    });
                }
            } else {
                for (let i = 0; i < neo4jRawArr.length; i++) {
                    let patient = neo4jRawArr[i];
                    patient.stages.forEach(function(s) {
                        let shortStageName = self.getShortStageName(s);

                        if ((shortStageName === stage) && (_.findIndex(obj.patients, patient) === -1)) {
                            obj.patients.push(patient);
                        }
                    });
                }
            }

            obj.patientsCount = obj.patients.length;
            
            // Add age of first encounter to the ages array for rendering box plot charts
            obj.patients.forEach(function(patient) {
                obj.ages.push(patient.firstEncounterAge);
            });

            stagesInfo.push(obj);
        });

        // Sort the stages by patients count in ascending order 
        //stagesJson.stagesInfo = _.sortBy(stagesInfo, 'patientsCount');
        stagesJson.stagesInfo = stagesInfo;

        // Return the JSON object 
        //console.log(stagesJson);
        return stagesJson;
    }
    

    static getDiagnosis(patientIds, neo4jRawArr) {
        let self = this;
        let diagnosisInfo = {};
        diagnosisInfo.patients = {};
        diagnosisInfo.diagnosisGroups = [];
        diagnosisInfo.data = [];

        let uniqueDiagnosisGroupsArr = [];

        // Build an array of unique diagnosis
        for (let i = 0; i < neo4jRawArr.length; i++) {
            neo4jRawArr[i].diagnosisGroups.forEach(function(diagGrp) {
                if (uniqueDiagnosisGroupsArr.indexOf(diagGrp) === -1) {
                    uniqueDiagnosisGroupsArr.push(diagGrp);
                } 
            });
        }

        // Added sorting for diaplay consistency when switching between stages
        diagnosisInfo.diagnosisGroups = uniqueDiagnosisGroupsArr.sort();

        patientIds.forEach(function(pid) {
            let obj = {};
            obj.patient = pid;
            obj.diagnosisGroups = [];

            for (let i = 0; i < neo4jRawArr.length; i++) {
                neo4jRawArr[i].diagnosisGroups.forEach(function(diagGrp) {
                    if (neo4jRawArr[i].patientId === pid && obj.diagnosisGroups.indexOf(diagGrp) === -1) {
                        obj.diagnosisGroups.push(diagGrp);
                    } 
                });
            }

            diagnosisInfo.data.push(obj);

            // Also add to the diagnosisInfo.patients object
            if (typeof diagnosisInfo.patients[pid] === "undefined") {
                diagnosisInfo.patients[pid] = obj.diagnosisGroups;
            }
        });

        return diagnosisInfo;
    }

/***************************************************************** */
 //New Function Label Summary getLabelSummary Saja Al-alawneh
 static getLabelSummary(patientIds, neo4jRawArr) {
// declare the four quarters days range
var q1=90;
var q2=180;
var q3=270;
var q4=365;

//console.log('****************************')
let patientdata = neo4jRawArr
//console.log(patientdata)

//let data= JSON.parse(JSON.stringify(neo4jRawArr));
//console.log('*******************************')
//console.log(patientdata)

//Store patients data into an array called patientdata

//documentDate is a string. Convert documnetDate which is a string to a date object
// I added an element to the array called  NewDate to store the date object for each document

for( var j = 0; j < patientdata.length; j++)
//for(var j in patientdata)
{
    patientdata[j]['NewDate']=new Date (patientdata[j]['documentDate']);
}
//sort the patientdata by the new date object 

//console.log(patientdata)
let patientDataSorted=_.sortBy(patientdata, ['NewDate']);
//console.log(patientDataSorted)

// Group the data using patientId
var patientGroups = _(patientDataSorted)
            .groupBy(x => x.patientId)
            .map((value, key ) => ({patientId: key, data: value}))
            .value();
//console.log('************************')
//console.log(patientGroups)

for (var i= 0; i< patientGroups.length; i++)
//for ( var i in patientGroups)
{
    for (var j=1; j<patientGroups[i].data.length; j++)
    //for (var j in patientGroups[i].data)
    {
        // first document for eachs patient is the starting date (Y1 and Q1)
        patientGroups[i].data[0]['Year']= 1; 
        patientGroups[i].data[0]['Quarter']= 1;
        patientGroups[i].data[0]['Month']=1;

        //substract each document date from the start date to align all the documents date for each patient according to the starting point
        var diff = Math.abs((patientGroups[i].data[0]['NewDate']- patientGroups[i].data[j]['NewDate'])/86400000);
        if (diff == 0) // When differenr documents for that same patients  have the same date
        {
            patientGroups[i].data[j].Year= 1
            patientGroups[i].data[j].Quarter= 1
            patientGroups[i].data[j].Month= 1
        }
        else
        {
        var diff1= Math.floor(diff);
        
        var docYear= Math.ceil(diff1/365); //to calculate the number of years where the documents distributed for each patient
        
        patientGroups[i].data[j]['Year']= docYear
        patientGroups[i].data[j]['Month']= Math.ceil(diff/30);
        
        //to calculate the quarter 
        // example : if the document is located in Year 2 and the difference between the first date and the current date is 488 days
        // Then to assign the quarter, I will use the following formula
        // docQuarter = Abs[(2-1)*365 - 488] = 123 (Quarter 2)
        let docQuarter= Math.abs((docYear-1) * 365 -diff1);

            if (docQuarter <= q1)
            {
                patientGroups[i].data[j]['Quarter']= 1;
            }
            else if (docQuarter > q1 && docQuarter<= q2)
            {
                patientGroups[i].data[j]['Quarter']= 2;
            }
        
            else if (docQuarter > q2 && docQuarter<= q3)
            {
                patientGroups[i].data[j]['Quarter']= 3;
            }
            else 
            {
                patientGroups[i].data[j]['Quarter']= 4;
            }
        }
    }
}
//Calculate total number of years in the cohort
var totalDaysDiff= Math.abs((patientDataSorted[0]['NewDate']- patientDataSorted[patientDataSorted.length-1]['NewDate'])/86400000);
var totalNumYear= Math.ceil(totalDaysDiff/365);

let CountsPerYearAndQuarter={}
 

// to aggregate  all documents for each patient, 
//  calculate the counts for each semnatic group (Finding, Procedure, Drug, Disorder, Lab, Others) 
//in each quarter/year 
let fields = ['FindingCount','DrugCount','ProcedureCount','LabCount','OtherCount','DisorderCount'];
let totals=[]

    for(i=0; i<patientGroups.length; i++) //loop through the patients (47 patients)
    {
      for(j=0;j<patientGroups[i].data.length; j++)// loop through the documents for each patients
        {
          // let quarter = patientGroups[i].data[j]['Quarter']
            //console.log(quarter)
           let year = patientGroups[i].data[j]['Year']
           let patient= patientGroups[i].patientId
           let month= patientGroups[i].data[j]['Month']

            if (!(year in totals)) 
            {
            totals[year]={};
            } 
           // if (!(quarter in totals[year])) 
           // {
           // totals[year][quarter]={};
           // }
           if (!(month in totals[year])) 
            {
            totals[year][month]={};
            }
            if (!(patient in totals[year][month])) 
            {
            totals[year][month][patient]={};
            }
            
            if (!(year in CountsPerYearAndQuarter)) 
            {
                CountsPerYearAndQuarter[year] = {};
            }
           // if (!(quarter in CountsPerYearAndQuarter[year]))
           // {
           //     CountsPerYearAndQuarter[year][quarter]={};
          //  }
          if (!(month in CountsPerYearAndQuarter[year]))
          {
              CountsPerYearAndQuarter[year][month]={};
          }
            for (var f=0; f < fields.length; f++) 
            {
                let field = fields[f];
		    
                if (!(field  in totals[year][month])) 
                {
                    totals[year][month][field] = 0;
                }
                
                totals[year][month][field] = totals[year][month][field] +
                                                patientGroups[i].data[j]['labelCounts'][field]
                 if (!(field  in CountsPerYearAndQuarter[year][month])) 
                {
                    CountsPerYearAndQuarter[year][month][field]={};
		            CountsPerYearAndQuarter[year][month][field]['counts']=0;
   		            CountsPerYearAndQuarter[year][month][field]['patients']=[];
                }
                CountsPerYearAndQuarter[year][month][field]['counts'] = parseInt(CountsPerYearAndQuarter[year][month][field]['counts'])+ 
                                                                            parseInt(patientGroups[i].data[j]['labelCounts'][field])
		          if  (!CountsPerYearAndQuarter[year][month][field]['patients'].includes(patient)) {
				CountsPerYearAndQuarter[year][month][field]['patients'].push(patient);
                }
               // console.log("*******************")
              //  console.log(year,month,field, CountsPerYearAndQuarter[year][month][field]['counts'])
            }   

        }
    }

// dump it 
//new structure to store the data into the form for the heat map
let transformed =[];
let patientList=[];
let newEntry = {};
let labelData={};
//iterate through the year 
for (var key in CountsPerYearAndQuarter ) 
{
    //iterate through the quarter in each year
    for (var key1 in CountsPerYearAndQuarter[key]) 
    {
       //iterate through the Labels 
        for (var key2 in CountsPerYearAndQuarter[key][key1])
        {  
	    newEntry={}
	    newEntry['year']=key; // Add Year
            newEntry['month']=parseInt(key1); //Add the month 

            newEntry['field']=key2; //Add Labels
            var key3 = CountsPerYearAndQuarter[key][key1][key2]['counts']
            newEntry['value']=parseInt(key3); //Add Label counts  
            
         for (var w=0; w<CountsPerYearAndQuarter[key][key1][key2].patients.length; w++)   
         {
            var key4=CountsPerYearAndQuarter[key][key1][key2].patients[w]
            if  (!patientList.includes(key4)) 
            {
                patientList.push(key4);
            }
         }    
            
            newEntry['patienList']=patientList
            
	    //console.log(JSON.stringify(newEntry))
        transformed.push(newEntry);
        }
        
    }      
}
labelData.label= transformed

var c =0;

for (var i=0; i< patientGroups.length; i++)
    {
        for (var j=0; j<patientGroups[i].data.length; j++)
            {
                if (patientGroups[i].data[j].documentEpisode=='unknown')
                    {
                        if (patientGroups[i].data[j].documentType =='Surgical Pathology Report')
                            {
                                patientGroups[i].data[j]['Episode']= 'Diagnostic'
                            }
                        else if (patientGroups[i].data[j].Month <=3 && patientGroups[i].data[j].documentType == 'Radiology Report')
                            {
                                patientGroups[i].data[j]['Episode']= 'Pre-diagnostic'    
                            }
                   
                        else if(patientGroups[i].data[j].documentType =='Progress Note' || 
                                patientGroups[i].data[j].documentType =='Discharge Summary')
                            {
                                patientGroups[i].data[j]['Episode']= 'Treatment'
                                c=c+1
                            }
                           
                        else
                            {
                                patientGroups[i].data[j]['Episode']=patientGroups[i].data[j].documentEpisode
                            }
                    }
                else
                    {
                        patientGroups[i].data[j]['Episode']= patientGroups[i].data[j].documentEpisode
                    }
            }
    }
    
let episodeWithoutunknown=[]
let episodeWithoutDuplication=[]
let episodeDataLevel=[]

//Remove unknown episode 
for (var i=0; i< patientGroups.length; i++)
    {
        for (var j=0; j<patientGroups[i].data.length; j++)
            {
                if (patientGroups[i].data[j].Episode != 'unknown')
                {
                
                    episodeWithoutunknown.push({'Patient': patientGroups[i].patientId,
                                            'Episode': patientGroups[i].data[j].Episode, 
                                            'Year' :patientGroups[i].data[j].Year, 
                                            'Quart':patientGroups[i].data[j].Quarter,
                                            'months': patientGroups[i].data[j].Month})
                }
            }
    }
//console.log(episodeWithoutunknown.length)
var patientEpisodeGroups = _(episodeWithoutunknown)
            .groupBy(x => x.Patient)
            .map((value, key ) => ({Patient: key, data: value}))
            .value();
           
//Remove Duplication Episode in the episode sequence

for (i=0; i<patientEpisodeGroups.length;i++)
    {
        for(j=1; j<patientEpisodeGroups[i].data.length;j++)
            {
                
                if (patientEpisodeGroups[i].data[j-1].Episode != patientEpisodeGroups[i].data[j].Episode)
                    {
                        episodeWithoutDuplication.push({'Patient': patientEpisodeGroups[i].data[j-1].Patient,
                                                         'Episode': patientEpisodeGroups[i].data[j-1].Episode, 
                                                         'Year' :patientEpisodeGroups[i].data[j-1].Year, 
                                                         'Quart':patientEpisodeGroups[i].data[j-1].Quart,
                                                         'months': patientEpisodeGroups[i].data[j-1].months})
                    }
                       
            }
                
    }
    //console.log(episodeWithoutDuplication.length)
var patientWithoutDupEpisodeGroup = _(episodeWithoutDuplication)
            .groupBy(x => x.Patient)
            .map((value, key ) => ({Patient: key, data: value}))
            .value();
            
            //Add the level for each episode sequence
for(var i=0; i<patientWithoutDupEpisodeGroup.length; i++)
    {
        for(var j=1;j<patientWithoutDupEpisodeGroup[i].data.length; j++)
            {
                episodeDataLevel.push({'Patient': patientWithoutDupEpisodeGroup[i].data[j-1].Patient,
                                                'source': patientWithoutDupEpisodeGroup[i].data[j-1].Episode, 
                                                'levelSource': j-1,
                                                'target': patientWithoutDupEpisodeGroup[i].data[j].Episode,
                                                'levelTarget': j,
                                                'Year' :patientWithoutDupEpisodeGroup[i].data[j-1].Year, 
                                                'Quart':patientWithoutDupEpisodeGroup[i].data[j-1].Quart,
                                                'months': patientWithoutDupEpisodeGroup[i].data[j-1].months})
                   
                    
            }
                
    }
  //  console.log(episodeDataLevel.length)
var episodeDataLevelGroup = _(episodeDataLevel)
            .groupBy(x => x.Patient)
            .map((value, key ) => ({Patient: key, data: value}))
            .value();

         
let episode=[]
//console.log(episodeDataLevelGroup)
for (var i=0; i<episodeDataLevelGroup.length; i++)
    {
        for (var j=0; j<episodeDataLevelGroup[i].data.length; j++)
            {
                var source= episodeDataLevelGroup[i].data[j].source //+ episodeDataLevelGroup[i].data[j].levelSource
                var target=episodeDataLevelGroup[i].data[j].target// + episodeDataLevelGroup[i].data[j].levelTarget
                var levelSource=episodeDataLevelGroup[i].data[j].levelSource
                var levelTarget=episodeDataLevelGroup[i].data[j].levelTarget
                if (!(source in episode) &&  (!(target in episode)))
                    {
                        source= source + " " + levelSource
                        target= target +" " + levelTarget
                        episode.push({'source': source,'target': target, 'patient': episodeDataLevelGroup[i].Patient })
                        //'patient': episodeDataLevelGroup[i].Patient
                    }
                    
            }
    }
    

           
//Sort Episode array first using source then target

let episodeSorted= _.sortBy(episode,['source'])
let episodeSortedTar=_.sortBy(episodeSorted,['target'])

//console.log(episodeSortedTar.length)
           
     //console.log(episodeSortedTar)       
var j=0;
var w=0;
var source;
var target;
var cnt=0;
let finalEpisode=[]
//let patientList=[]
while (j<episodeSortedTar.length)
    {
        source=episodeSortedTar[w].source
        target=episodeSortedTar[w].target
        for (i=w; i<episodeSortedTar.length;i++)
            {
                if (episodeSortedTar[i].source==source && episodeSortedTar[i].target==target)
                    {
                        cnt =cnt +1
                    }
                else 
                    {
                        finalEpisode.push({'source': source, 
                                            'target': target,
                                             'value': cnt})
                                                        
                        cnt=0;
                        w=i;
                        break;
                                    
                    }
                            
                }
                
            j++
                
    }
    
//console.log(finalEpisode.length)
let sourceNode=[]
let targetNode=[]
for (var w=0; w<finalEpisode.length; w++)
{
   sourceNode[w]=finalEpisode[w].source
   targetNode[w]=finalEpisode[w].target
}
//console.log(sourceNode)
//console.log(targetNode)
//}
var nodeSourceWithoutDupl= sourceNode.filter((v,i,a)=> a.indexOf(v)=== i);
var nodeTargetWithoutDupl=targetNode.filter((v,i,a)=> a.indexOf(v)=== i);
var nodesWithDup =nodeSourceWithoutDupl.concat(nodeTargetWithoutDupl)
//console.log(sourceNode,' ', nodeSourceWithoutDupl )
//console.log(targetNode, ' ', nodeTargetWithoutDupl)
var nodeWithoutDup = nodesWithDup.filter((v,i,a)=> a.indexOf(v)===i );
let Nodes=[];
for(var i=0; i< nodeWithoutDup.length; i++)
{
    Nodes.push({"name": nodeWithoutDup[i]})
}

let Links=[];
for(var j=0; j< finalEpisode.length; j++)
{
    var S= finalEpisode[j].source
    var T= finalEpisode[j].target

    Links.push({"source": nodeWithoutDup.indexOf(S), 
                    "target": nodeWithoutDup.indexOf(T),
                    "value": finalEpisode[j].value})
}
//console.log(Links)
//console.log(Nodes)
let episodeData ={}
episodeData["nodes"]=Nodes
episodeData["links"]= Links
labelData.episode=episodeData

  //console.log(labelData)
    return (labelData);
    //return (transformed);
   // return neo4jRawArr;
};
//********************************************************************** */

    static getBiomarkers(neo4jRawArr, patientIds) {
        let info = {};
        info.biomarkersOverviewData = [];
        info.patientsWithBiomarkersData = {};
        info.patientsWithBiomarkersData.biomarkersPool = ["has_ER_Status", "has_PR_Status", "has_HER2_Status"];
        info.patientsWithBiomarkersData.biomarkerStatus = ['positive', 'negative', 'unknown'];
        info.patientsWithBiomarkersData.data = [];
        
        let patientsWithBiomarkers = [];
        let patientsWithoutBiomarkers = [];

        let biomarkersData = {};
   //     console.log(neo4jRawArr);

        // Initialize the biomarker statistics data
        info.patientsWithBiomarkersData.biomarkersPool.forEach(function(biomarker) {
            let obj = {};
            obj.positive = [];
            obj.negative = [];
            obj.unknown = [];

            biomarkersData[biomarker] = obj;
        });

        

        // Parse the receptor type and status
        neo4jRawArr.forEach(function(obj) {
            // Count patients with biomarkers
            if (patientsWithBiomarkers.indexOf(obj.patientId) === -1) {
                patientsWithBiomarkers.push(obj.patientId);
            }

        	// Skip the case when there's no "valueText" property
        	if (typeof obj.tumorFact.valueText !== "undefined") {
                let status = obj.tumorFact.valueText.toLowerCase();
                if (biomarkersData[obj.tumorFactRelation][status].indexOf(obj.patientId) === -1) {
                    biomarkersData[obj.tumorFactRelation][status].push(obj.patientId);
                }
        	} 
        });
        
        // Patients without biomarkers
        patientIds.forEach(function(id) {
            if (patientsWithBiomarkers.indexOf(id) === -1) {
                patientsWithoutBiomarkers.push(id);
            }
        });


        // Further process to meet the needs of front end rendering
        info.patientsWithBiomarkersData.biomarkersPool.forEach(function(biomarker) {
            let obj = {};
            obj.biomarker = biomarker;
            obj.positive = 0;
            obj.negative = 0;
            obj.unknown = 0;

            let totalCount = biomarkersData[biomarker].positive.length + biomarkersData[biomarker].negative.length + biomarkersData[biomarker].unknown.length;

            // Calculate percentage, decimals without % sign
            if (totalCount > 0) {
                obj.positive = parseFloat(biomarkersData[biomarker].positive.length / totalCount).toFixed(3);
                obj.negative = parseFloat(biomarkersData[biomarker].negative.length / totalCount).toFixed(3);
                obj.unknown = parseFloat(biomarkersData[biomarker].unknown.length / totalCount).toFixed(3);
            }  

            info.patientsWithBiomarkersData.data.push(obj);
        });

        // For biomarkers patients chart
        let patientsWithBiomarkersObj = {};
        patientsWithBiomarkersObj.label = "Patients with biomarkers found";
        patientsWithBiomarkersObj.count = parseFloat(patientsWithBiomarkers.length / patientIds.length).toFixed(3);

        let patientsWithoutBiomarkersObj = {};
        patientsWithoutBiomarkersObj.label = "Patients without biomarkers found";
        patientsWithoutBiomarkersObj.count = parseFloat(patientsWithoutBiomarkers.length / patientIds.length).toFixed(3);

        info.biomarkersOverviewData.push(patientsWithBiomarkersObj);
        info.biomarkersOverviewData.push(patientsWithoutBiomarkersObj);
        //console.log(info);
        //console.log(JSON.stringify(info));
        return info;
    }

    /////////////////////////////////////////////////////////////////////////////////////////
    //
    //                            INDIVIDUAL PATIENT
    //
    ////////////////////////////////////////////////////////////////////////////////////////

    static getPatientInfo(neo4jRawJson) {
        let patientInfo = {};
        let patientObj = neo4jRawJson;

        patientInfo.id = patientObj.patientId;
        patientInfo.name = patientObj.patientName;
        patientInfo.firstEncounterAge = patientObj.firstEncounterAge;
        patientInfo.lastEncounterAge = patientObj.lastEncounterAge;
//        console.log(patientInfo);
        return patientInfo;
    }

    // A patient may have multiple cancers
    static getCancerAndTumorSummary(neo4jRawArr) {
        let self = this;
        let cancers = [];
        let uniqueCancerIds = [];

        for (let i = 0; i < neo4jRawArr.length; i++) {
            if (uniqueCancerIds.indexOf(neo4jRawArr[i].cancerId) === -1) {
                uniqueCancerIds.push(neo4jRawArr[i].cancerId);
            }
        }

        // Assemble cancerSummary for each cancer
        uniqueCancerIds.forEach(function(cancerId) {
            let cancerSummary = {};

            // Basically the values of hasDiagnosis, hasBodySite and hasLaterality if one exists
            // E.g., "Invasive Ductal Carcinoma, Breast (Left)"
            // Use cancerId for now
            cancerSummary.cancerId = cancerId;
            cancerSummary.title = cancerId;

            // TNM array
            cancerSummary.tnm = [];

            // Tumors object
            cancerSummary.tumors = {};

            // Build an arry of unique cancerFactReln
            let uniqueCancerFactRelnArr = [];

            // For later retrival use
            let relationPrettyNameMap = new Map();

            for (let i = 0; i < neo4jRawArr.length; i++) {
                if (neo4jRawArr[i].cancerId === cancerId) {
                    let cancerFacts = neo4jRawArr[i].cancerFacts;

                    cancerFacts.forEach(function(cancerFact) {
                        let relation = cancerFact.relation;
                        let relationPrettyName = cancerFact.relationPrettyName;

                        // First compose a meaningful title for this cancer summary
                        // Basically the values of hasDiagnosis, hasBodySite and hasLaterality if one exists

                        // Skip the body site, it's in the tumor summary
                        // Don't show Diagnosis, Tumor Extent, and TNM Prefix in cancer summary
                        let excludedRelations = [
                            "hasBodySite",
                            "hasDiagnosis",
                            "hasTumorExtent"
                        ];

                        if (uniqueCancerFactRelnArr.indexOf(relation) === -1 && excludedRelations.indexOf(relation) === -1) {
                            // Histological type could be interesting - but not needed for breast cancer
                            // Need to filter here?
                            uniqueCancerFactRelnArr.push(relation);

                            // Also add to the relationPrettyName mapping
                            relationPrettyNameMap.set(relation, relationPrettyName);
                        } 
                    });
                }
            }

            // Sort this uniqueCancerFactRelnArr in a specific order
            // categories not in this order will be listed at the bottom
            // based on their original order
            const order = [
                'hasCancerStage', 
                'hasTreatment'
            ];
            
            // Sort the uniqueCancerFactRelnArr by the item's index in the order array
            let sortedUniqueCancerFactRelnArr = self.sortByProvidedOrder(uniqueCancerFactRelnArr, order);

            // Build new data structure
            // This is similar to what getCollatedFacts() does,
            // except it only handles one cancer ID.
            let allCollatedCancerFacts = [];

            for (let j = 0; j < sortedUniqueCancerFactRelnArr.length; j++) {
                let collatedCancerFactObj = {};

                // The name of category
                collatedCancerFactObj.category = sortedUniqueCancerFactRelnArr[j];
                collatedCancerFactObj.categoryName = relationPrettyNameMap.get(sortedUniqueCancerFactRelnArr[j]);

                // Array of facts of this category
                collatedCancerFactObj.facts = [];

                let factsArr = [];

                // Loop through the origional data
                for (let k = 0; k < neo4jRawArr.length; k++) {
                    if (neo4jRawArr[k].cancerId === cancerId) {
                        neo4jRawArr[k].cancerFacts.forEach(function(cancerFact) {
                            let cancerFactReln = cancerFact.relation;
                        
                            let factObj = {};
                            factObj.id = cancerFact.cancerFactInfo.id;
                            factObj.name = cancerFact.cancerFactInfo.name;
                            factObj.prettyName = cancerFact.cancerFactInfo.prettyName;

                            // Add to facts array
                            // Filter out Treatment facts that start with "Other" or "pharmacotherapeutic", they are not helpful to show
                            if (cancerFactReln === collatedCancerFactObj.category && !factObj.prettyName.startsWith("Other") && !factObj.prettyName.startsWith("pharmacotherapeutic")) {
                                factsArr.push(factObj);
                            }
                        });
                    }
                }

                // Array of facts of this category
                // Remove duplicates using lodash's _.uniqWith() then sort by the alphabetical order of 'prettyName'
                collatedCancerFactObj.facts = _.sortBy(_.uniqWith(factsArr, _.isEqual), ['prettyName']);

                // Add collatedFactObj to allCollatedFacts only when the facts array is not empty after all the above filtering
                // E.g., treatment facts can be an empty array if the treatements are OtherTherapeuticProcedure and OtherMedication
                // since they'll get filtered out
                if (collatedCancerFactObj.facts.length > 0) {
                    allCollatedCancerFacts.push(collatedCancerFactObj);
                }
            }

            // Will use this to build TNM staging table
            const tnmClassifications = {
                "clinical": [
                    'has_Clinical_T',
                    'has_Clinical_N',
                    'has_Clinical_M'
                ],
                "pathologic": [
                    'has_Pathologic_T',
                    'has_Pathologic_N',
                    'has_Pathologic_M'
                ]
            };

            // Hard code type names
            // Use "Unspecified" as the title of Generic TNM
            let clinicalTNM = self.buildTNM(allCollatedCancerFacts, "Clinical", tnmClassifications.clinical);
            let pathologicTNM = self.buildTNM(allCollatedCancerFacts, "Pathologic", tnmClassifications.pathologic);

            // Add to cancerSummary.tnm if has data
            if (clinicalTNM.data.length > 0 || clinicalTNM.data.T.length > 0 || clinicalTNM.data.N.length > 0 || clinicalTNM.data.M.length > 0) {
                cancerSummary.tnm.push(clinicalTNM);
            }

            if (pathologicTNM.data.length > 0 || pathologicTNM.data.T.length > 0 || pathologicTNM.data.N.length > 0 || pathologicTNM.data.M.length > 0) {
                cancerSummary.tnm.push(pathologicTNM);
            }

            // Categories other than TNM
            cancerSummary.collatedCancerFacts = allCollatedCancerFacts.filter(function(obj) {
                return (tnmClassifications.clinical.indexOf(obj.category) === -1 && tnmClassifications.pathologic.indexOf(obj.category) === -1);
            });

            // Get tumor summary
            neo4jRawArr.forEach(function(cancer) {
                if (cancer.cancerId === cancerId) {
                    // Add to the tumors
                    cancerSummary.tumors = self.getTumorSummary(cancer.tumors);

                    // Finally add to the cancers array
                    cancers.push(cancerSummary);
                }
            });
        });
//        console.log(cancers);
        return cancers;

    }
 
    static getTumorSummary(tumorsArr) {
        let self = this;

        let tumorSummary = {};
        // Sorted target tumors
        tumorSummary.tumors = [];
        tumorSummary.listViewData = [];
        tumorSummary.tableViewData = [];
        
        // Show Primary on the first row/column...
        const tumorTypesArr = [
            'Primary',
            'Metastasis',
            'Benign',
            'Generic'
        ];

        // Sort this uniqueRelationsArr in a specific order
        // categories not in this order will be listed at the bottom
        // based on their original order
        const order = [
            'hasBodySite',
            'hasLaterality',
            'hasDiagnosis',
            'hasTreatment',
            // Group biomarkers - Breast cancer only
            'has_ER_Status',
            'has_PR_Status',
            'has_HER2_Status',
            'hasKi67Status',
            // Group tumor sizes
            'hasTumorSize',
            'hasRadiologicTumorSize',
            'hasPathologicTumorSize',
            'hasPathologicAggregateTumorSize',
            'hasNuclearGrade'
        ];

        // Build an arry of unique tumors (id and type)
        let tumors = [];
        for (let i = 0; i < tumorsArr.length; i++) {
            let tumorObj = {};
            tumorObj.id = tumorsArr[i].tumorId;
            tumorObj.type = tumorsArr[i].hasTumorType;

            tumors.push(tumorObj);    
        }

        // Sort by tumor types
        let sortedTumors = this.sortByTumorType(tumors, tumorTypesArr);

        // Add to the final data structure
        tumorSummary.tumors = sortedTumors;

        // Build the data structure for list view
        let targetTumorsForListView = sortedTumors; // Make a copy

        let relationPrettyNameMap = new Map();

        targetTumorsForListView.forEach(function(targetTumor) {
            // Add new property
            targetTumor.data = [];

            tumorsArr.forEach(function(origTumor) {
                // Now for each tumor's each relation category, group the facts
                if (targetTumor.id === origTumor.tumorId) {
                    let uniqueRelationsArr = [];
                    

                    origTumor.tumorFacts.forEach(function(tumorFact) {
                        // Skip the treatment facts because treatments are for cancer summary?
                        if (tumorFact.relation !== 'hasTreatment') {
                            if (uniqueRelationsArr.indexOf(tumorFact.relation) === -1) {
                                uniqueRelationsArr.push(tumorFact.relation);
                                // Also add to map
                                relationPrettyNameMap.set(tumorFact.relation, tumorFact.relationPrettyName);
                            }
                        }
                    });

                    // Sort the uniqueRelationsArr by the item's index in the order array
                    let sortedFactRelationships = self.sortByProvidedOrder(uniqueRelationsArr, order);

                    // Then add the data
                    sortedFactRelationships.forEach(function(reln) {
                        let dataObj = {};
                        dataObj.category = relationPrettyNameMap.get(reln);
                        dataObj.categoryClass = self.getCategoryClass(reln);
                        dataObj.facts = [];

                        origTumor.tumorFacts.forEach(function(tumorFact) {
                            if (tumorFact.relation === reln) {
                                dataObj.facts.push(tumorFact.tumorFactInfo);
                            }
                        });

                        // Add to data
                        targetTumor.data.push(dataObj);
                    });
                }
            });
        });

        // List view data array
        tumorSummary.listViewData = targetTumorsForListView;

        // Build the data structure for table view
        let allTumorFactRelnArr = [];

        // Get a list of tumor fact relationships for each tumor
        tumorsArr.forEach(function(tumor) {
            let tumorFactRelnArr = self.getTumorFactRelnArr(tumor.tumorFacts);
            allTumorFactRelnArr.push(tumorFactRelnArr);
        });

        let mergedArr = [];
        allTumorFactRelnArr.forEach(function(reln) {
            // https://lodash.com/docs/4.17.4#union
            // Creates an array of unique values, in order, from all given arrays
            mergedArr = _.unionWith(mergedArr, reln, _.isEqual);
        });

        // Sort the fact relationships by the item's index in the order array
        let sortedAllFactRelationships = this.sortByProvidedOrder(mergedArr, order);

        // For each category, get collacted facts for each tumor
        sortedAllFactRelationships.forEach(function(reln) {
            let factsByCategoryObj = {};
            // Convert the 'hasXXX' relationship to category
            factsByCategoryObj.category = relationPrettyNameMap.get(reln);
            factsByCategoryObj.categoryClass = self.getCategoryClass(reln);
            factsByCategoryObj.data = [];

            sortedTumors.forEach(function(targetTumor) {
                tumorsArr.forEach(function(origTumor) {
                    if (targetTumor.id === origTumor.tumorId) {
                        let obj = {};
                        obj.tumorId = origTumor.tumorId;
                        obj.facts = [];

                        origTumor.tumorFacts.forEach(function(tumorFact) {
                            if (tumorFact.relation === reln) {
                                obj.facts.push(tumorFact.tumorFactInfo);
                            }
                        });

                        // Add to factsByCategoryObj.data
                        factsByCategoryObj.data.push(obj);
                    }
                });
            });

            // Add to the table view data
            tumorSummary.tableViewData.push(factsByCategoryObj);
        });
 
        // Finally all done
        return tumorSummary;
    }


    // Convert the index array to named array
    static getTimelineData(neo4jRawJson) {
        let self = this;

        let preparedReports = {};
        // Properties
        preparedReports.patientInfo = neo4jRawJson.patientInfo;
        preparedReports.reportData = [];
        preparedReports.typeCounts = {};
        preparedReports.episodes = [];
        preparedReports.episodeCounts = {};

       //console.log(neo4jRawJson);
        // First sort by date
        let sortedReportsArr = this.sortReportsByDate(neo4jRawJson.reports); 

        let reportTypes = [];

        let episodes = [];
        let episodeDates = {};

        // Using lodash's `_.forEach()`
        _.forEach(sortedReportsArr, function(reportObj) { 
            let report = {};

            report.id = reportObj.reportId;
            report.date = reportObj.reportDate;
            report.name = reportObj.reportName;
            report.type = reportObj.reportType; // Is already formatted/normalized
            report.episode = self.capitalizeFirstLetter(reportObj.reportEpisode); // Capitalized

            // Add to reportData array
            preparedReports.reportData.push(report);

            // Create an array of report types without duplicates
            if (reportTypes.indexOf(report.type) === -1) {
                reportTypes.push(report.type);
            }
  
            // Add the type as key to typeCounts object
            // JavaScript objects cannot have duplicate keys
            if (report.type in preparedReports.typeCounts) {
                preparedReports.typeCounts[report.type]++;
            } else {
                preparedReports.typeCounts[report.type] = 1;
            }

            // Create an array of episode types without duplicates
            if (episodes.indexOf(report.episode) === -1) {
                // Capitalize the episode name
                episodes.push(report.episode);
            }

            // Also count the number of reports for each episode type
            if (report.episode in preparedReports.episodeCounts) {
                preparedReports.episodeCounts[report.episode]++;
            } else {
                preparedReports.episodeCounts[report.episode] = 1;
            }

            // Add dates to each episode dates named array
            if (typeof (episodeDates[report.episode]) === 'undefined') {
                // Use the episode name as key
                episodeDates[report.episode] = [];
            }
            
            episodeDates[report.episode].push(report.date);
        });

        // Sort the report types based on this specific order
        const orderOfReportTypes = [
            'Progress Note',
            'Radiology Report',
            'Surgical Pathology Report',
            'Discharge Summary',
            'Clinical Note'
        ];

        preparedReports.reportTypes = this.sortByProvidedOrder(reportTypes, orderOfReportTypes);

        // Sort the episodes based on this specific order, capitalized
        const orderOfEpisodes = [
            'Pre-diagnostic',
            'Diagnostic',
            'Medical Decision-making',
            'Treatment',
            'Follow-up',
            "Unknown"
        ];

        preparedReports.episodes = this.sortByProvidedOrder(episodes, orderOfEpisodes);

        preparedReports.episodeDates = episodeDates;

        // Group the report objects by report date, not time
        // This returns a named array, key is the date, value is an arry of reports with the same date
        let reportsGroupedByDateObj = _.groupBy(preparedReports.reportData, function(report) {
            return report.date;
        });

        // Then further group by report type on top of the grouped date
        let reportsGroupedByDateAndTypeObj = {};
        
        for (let property in reportsGroupedByDateObj) {
            if (reportsGroupedByDateObj.hasOwnProperty(property)) {
                let arr = reportsGroupedByDateObj[property];
                let reportsGroupedByTypeObj = _.groupBy(arr, function(report) {
                    return report.type;
                });

                if (typeof reportsGroupedByDateAndTypeObj[property] === 'undefined') {
                    reportsGroupedByDateAndTypeObj[property] = {};
                }

                reportsGroupedByDateAndTypeObj[property] = reportsGroupedByTypeObj;
            }
        }

        preparedReports.reportsGroupedByDateAndTypeObj = reportsGroupedByDateAndTypeObj;

        // Calculate the max number of vertically overlapped reports
        // this will be used to determine the height of each report type row in timeline
        // verticalCountsPerType keys is not ordered by the `orderOfReportTypes`
        let verticalCountsPerType = {};

        for (let property in reportsGroupedByDateAndTypeObj) {
            if (reportsGroupedByDateAndTypeObj.hasOwnProperty(property)) {
                for (let type in reportsGroupedByDateAndTypeObj[property]) {
                    let arr = reportsGroupedByDateAndTypeObj[property][type];

                    if (typeof verticalCountsPerType[type] === 'undefined') {
                        verticalCountsPerType[type] = [];
                    }

                    verticalCountsPerType[type].push(arr.length);
                }
            }
        }

        // Find the max vertical count of reports on the same date for each report type
        // maxVerticalCountsPerType keys is not ordered by the `orderOfReportTypes`
        let maxVerticalCountsPerType = {};

        for (let property in verticalCountsPerType) {
            if (verticalCountsPerType.hasOwnProperty(property)) {
                if (typeof maxVerticalCountsPerType[property] === 'undefined') {
                    maxVerticalCountsPerType[property] = _.max(verticalCountsPerType[property]);
                }
            }
        }

        preparedReports.maxVerticalCountsPerType = maxVerticalCountsPerType;

        // Return everything
//        console.log(preparedReports);
        return preparedReports;
    }

    // One fact can have multiple matching texts
    // And the same matching text can be found in multiple places in the same report
    static getFact(neo4jRawJson) {
        let self = this;

        let factJson = {};

        factJson.sourceFact = neo4jRawJson.sourceFact;
        factJson.groupedTextProvenances = [];

        let docIds = [];
        neo4jRawJson.mentionedTerms.forEach(function(textMention) {
            if (docIds.indexOf(textMention.reportId) === -1) {
                docIds.push(textMention.reportId);
            }
        });

        // Named array object
        let groupedTextProvenances = {};

        docIds.forEach(function(id) {
            let textProvenanceObj = {};
            textProvenanceObj.docId = id;
            textProvenanceObj.terms = [];
            textProvenanceObj.texts = [];
            textProvenanceObj.textCounts = [];

            neo4jRawJson.mentionedTerms.forEach(function(textMention) {
                if (textMention.reportId === id) {
                    let termObj = {};
                    termObj.term = textMention.term;
                    termObj.begin = textMention.begin;
                    termObj.end = textMention.end;
                    
                    textProvenanceObj.terms.push(termObj);
                    
                    // This is used to generate the count per term
                    textProvenanceObj.texts.push(textMention.term);
                }
            });

            if (typeof groupedTextProvenances[id] === "undefined") {
                groupedTextProvenances[id] = textProvenanceObj;
            }
        });

        // Additional process to aggregate text mentions with count for each group
        Object.keys(groupedTextProvenances).forEach(function(key) {
            let textCounts = [];
            let textsArr = groupedTextProvenances[key].texts;

            textsArr.forEach(function(text) {
                let countObj = {};
                countObj.text = text;
                countObj.count = _.countBy(textsArr)[text];

                textCounts.push(countObj);
            });
            
            // Remove duplicates and add to groupedTextProvenances[key]
            groupedTextProvenances[key].textCounts = _.uniqWith(textCounts, _.isEqual);
        });

        factJson.groupedTextProvenances = groupedTextProvenances;

        return factJson;
    }

    /////////////////////////////////////////////////////////////////////////////////////////
    //
    //                            API ONLY
    //
    ////////////////////////////////////////////////////////////////////////////////////////
    
    // Wrap the array into json
    static getAllPatients(neo4jRawArr) {
        let json = {};
        json.allpatients = neo4jRawArr;

        return json;
    }


    /////////////////////////////////////////////////////////////////////////////////////////
    //
    //                            INTERNAL HELERS USED BY CHORT AND INDIVIDUAL PATIENT
    //
    ////////////////////////////////////////////////////////////////////////////////////////
    
    // ES6 Class doesn't support class variables, we use a static function instead
    // for shared variables
    static getOrderedCancerStages() {
        // All stages in a sorted order
        return [
            'Stage 0', 
            // Stage I
            'Stage I',
            'Stage IA',
            'Stage IB',
            'Stage IC',
            // Stage II
            'Stage II',
            'Stage IIA',
            'Stage IIB',
            'Stage IIC',
            // Stage III
            'Stage III',
            'Stage IIIA',
            'Stage IIIB',
            'Stage IIIC',
            // Stage IV
            'Stage IV',
            'Stage IVA',
            'Stage IVB',
            'Stage IVC',
            // Stage Unknown
            'Stage Unknown'
        ];
    }

    static buildTNM(collatedFacts, type, tnmClassifications) {
        let tnmObj = {};

        // Two properties
        tnmObj.type = type;
        tnmObj.data = {};
        // Make sure to use T, N, M as keys so we don't 
        // have to worry about the ordering of corresponding facts data
        tnmObj.data.T = [];
        tnmObj.data.N = [];
        tnmObj.data.M = [];

        // Build the TNM object of this type
        // collatedFacts contains all the cancer categories, we only need the TNM relationships of this type
        for (let i = 0; i < collatedFacts.length; i++) {
            if (tnmClassifications.indexOf(collatedFacts[i].category) !== -1) {
                let itemObj = {};
                // Extracted the last letter of the classification, "T", or "N", or "M"
                let classification = collatedFacts[i].category.substr(-1);
                tnmObj.data[classification] = collatedFacts[i].facts;
            }
        }

        return tnmObj;
    }

    // Only get the first two words, e.g., "Stage IA"
    static getShortStageName(longStageName) {
        return longStageName.split(/\s+/).slice(0, 2).join(' ');
    }

    // Used by episode
    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // https://stackoverflow.com/questions/18859186/sorting-an-array-of-javascript-objects-a-specific-order-using-existing-function
    static sortByProvidedOrder(array, orderArr) {
        let orderMap = new Map();

        orderArr.forEach(function(item) { 
            // Remember the index of each item in order array
            orderMap.set(item, orderArr.indexOf(item));
        });

        // Sort the original array by the item's index in the orderArr
        // It's very possible that items are in array may not be in orderArr
        // so we assign index starting from orderArr.length for those items
        let i = orderArr.length;
        let sortedArray = array.sort(function(a, b){ 
            if (!orderMap.has(a)) {
                orderMap.set(a, i++);
            }
 
            if (!orderMap.has(b)) {
                orderMap.set(b, i++);
            }

            return (orderMap.get(a) - orderMap.get(b));
        });

        return sortedArray;
    }

    // In tumor summary table, show Primary Neoplasm in the first data column...
    static sortByTumorType(array, orderArr) {
        let orderMap = new Map();

        orderArr.forEach(function(item) { 
            // Remember the index of each item in order array
            orderMap.set(item, orderArr.indexOf(item));
        });

        // Sort the original array by the item's index in the orderArr
        // It's very possible that items are in array may not be in orderArr
        // so we assign index starting from orderArr.length for those items
        let i = orderArr.length;
        let sortedArray = array.sort(function(a, b){ 
            // Use item.type since we are ordering by tumor type
            // this is the only difference from sortByProvidedOrder()
            if (!orderMap.has(a.type)) {
                orderMap.set(a.type, i++);
            }
 
            if (!orderMap.has(b.type)) {
                orderMap.set(b.type, i++);
            }

            return (orderMap.get(a.type) - orderMap.get(b.type));
        });

        return sortedArray;
    }

    // For tumor fact box background rendering in CSS
    static getCategoryClass(categoryClass) {
        // Manual filtering for now
        const categoryClassesArr = [
            'hasBodySite',
            'hasLaterality',
            'hasDiagnosis',
            'hasTreatment',
            'has_ER_Status',
            'has_PR_Status',
            'has_HER2_Status',
            'hasKi67Status',
            'hasClockface',
            'hasTumorSize',
            'hasRadiologicTumorSize',
            'hasPathologicTumorSize',
            'hasPathologicAggregateTumorSize',
            'hasCancerCellLine',
            'hasHistologicType',
            'hasTumorExtent'
        ];

        if (categoryClassesArr.indexOf(categoryClass) === -1) {
            categoryClass = 'unspecified';
        } 

        return categoryClass;
    }

    // Get an arry of tumor fact relationships without duplicates
    static getTumorFactRelnArr(tumorFacts) {
        // Build an arry of unique tumorFactReln
        let uniqueTumorFactRelnArr = [];

        for (let i = 0; i < tumorFacts.length; i++) {
            // HACK - filter out `hasTumorType`, `hasTreatment`
            if (tumorFacts[i].relation !== 'hasTumorType' && tumorFacts[i].relation !== 'hasTreatment') {
                uniqueTumorFactRelnArr.push(tumorFacts[i].relation);
            }
        }

        return uniqueTumorFactRelnArr;
    }

    // Sort from newest date to oldest date
    // Format the report type
    static sortReportsByDate(reportsArr) {
        // Date format returned by neo4j is "07/19/2006 09:33 AM EDT"
        //console.log(reportsArr);
        reportsArr.sort(function(a, b) {
            // Turn strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.
            return (new Date(b.reportDate) - new Date(a.reportDate));
        });
    

        // Now we just put the data we need together
        let arr = [];
        for (let i = 0; i < reportsArr.length; i++) {
            let typeArr = reportsArr[i].reportType.toLowerCase().split('_');
            typeArr.forEach(function(v, i, a) {
                // Capitalize the first letter of each word
                a[i] = v.charAt(0).toUpperCase() + v.substr(1);
            });

            // Joins all elements of the typeArr into a string
            reportsArr[i].reportType = typeArr.join(' ');

            arr.push(reportsArr[i]);
        }

        return arr;
    }
    static sortDocumentsByDate(documentsArr) {
        // Date format returned by neo4j is "07/19/2006 09:33 AM EDT"
        
        documentsArr.sort(function(a, b) {
            // Turn strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.
            return (new Date(b.documentDate) - new Date(a.documentDate));
        });
        // Now we just put the data we need together
        let arr1 = [];
        for (let i = 0; i < documentsArr.length; i++) {
            let typeArr = documentsArr[i].documentType.toLowerCase().split('_');
            typeArr.forEach(function(v, i, a) {
                // Capitalize the first letter of each word
                a[i] = v.charAt(0).toUpperCase() + v.substr(1);
            });

            // Joins all elements of the typeArr into a string
            documentsArr[i].documentType = typeArr.join(' ');

            arr1.push(documentsArr[i]);
        }

        return arr1;
    }

}

/**
 * Expose the DataProcessor class as a local module
 */
module.exports = DataProcessor;

