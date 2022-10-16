const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// Get Movie API 1
app.get("/states/", async (request, response) => {
  const getStateQuery = `SELECT
      *
    FROM
       state    
      ;`;
  const stateArray = await db.all(getStateQuery);
  const objectStateArray = stateArray.map((staterecords) => {
    return convertDbObjectToResponseObject(staterecords);
  });
  response.send(objectStateArray);
});

// API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT
      *
    FROM
      state
    WHERE
      state_id = ${stateId};`;
  const statesArray = await db.get(getStateQuery);
  const stateObjectModifed = convertDbObjectToResponseObject(statesArray);
  response.send(stateObjectModifed);
});

//API3

app.post("/districts/", async (request, response) => {
  const districtsDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtsDetails;
  const addDistrictQuery = `INSERT INTO
      district (district_name,state_id,cases,cured,active,deaths)
    VALUES
      (       
       '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}        
      );`;

  const dbResponse = await db.run(addDistrictQuery);

  response.send("District Successfully Added");
});

//API4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT
      *
    FROM
      district
    WHERE
      district_id = ${districtId};`;
  const dbResponse = await db.get(getDistrictQuery);
  const districtObjectModifed = convertDbObjectToResponseObject(dbResponse);
  response.send(districtObjectModifed);
});

//API5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuary = `
    delete from district where district_id = ${districtId};
    `;
  await db.run(deleteDistrictQuary);
  response.send("District Removed");
});

//API6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrict = `
  update district set 
  district_name = '${districtName}',
  state_id = ${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}

  where district_id = ${districtId};
  `;
  const dbResponse = await db.run(updateDistrict);
  response.send("District Details Updated");
});

//API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT
      sum(cases) as totalCases,
      sum(cured) as totalCured,
      sum(active) as totalActive,
      sum(Deaths) as totalDeaths
    FROM
      district
    WHERE
      state_id = ${stateId};`;
  const movieArray = await db.get(getStateQuery);
  /*const objectMovieArray = movieArray.map((moviename) => {
    return convertDbObjectToResponseObject(moviename);
  });*/
  response.send(movieArray);
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
  select state_name as stateName
  from state
  where state_id in(
      SELECT
     state_id as stateName
    FROM
      district
    WHERE
      district_id = ${districtId}
  );
  
  `;
  const dbArray = await db.get(getDistrictQuery);
  /*const objectMovieArray = movieArray.map((moviename) => {
    return convertDbObjectToResponseObject(moviename);
  });*/
  response.send(dbArray);
});

module.exports = app;
