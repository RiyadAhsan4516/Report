const totalDays = document.querySelector(".totalDays");
const datetable = document.querySelector(".tdate");
const dailytable = document.querySelector(".dailylists");

console.time("execution time")

// This function fetches the data:
async function getData() {
    let response = await fetch('./attendance_data_3.json');
    response = await response.json();
    return response;
}


// Save the fetched data into a variable.
let data = await getData();
let datafixed = await getData();


// Format the date
data.forEach(item => {
    const d = new Date(item.datetime);
    item.datetime = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
})


// Format and add the time and date field from datetime:
datafixed.forEach(item => {
    let ex = item.datetime;
    ex = ex.split(" ")
    item.date = ex[1]
    item.time = +ex[0].split(":").join("");
})


//---------------------------------------------------------------------------------------------------------------------------------------------------------------
// PRESENT DAYS
//---------------------------------------------------------------------------------------------------------------------------------------------------------------

function calculatePresentDays() {
    let idObj = {};
    for (let i = 0; i < data.length; i++) {
        const id = data[i].id;
        const date = data[i].datetime;
        if (!idObj[id]) {
            idObj[id] = new Set();
            idObj[id].add(date);
        } else {
            idObj[id].add(date);
        }
    }
    return idObj;
}

const presentDays = calculatePresentDays(); // {id : set};
const totalemployees = Object.keys(presentDays).length;


//----------------------------------------------------------------------------------------------------------------------------------------------------------------
// LATE DAYS
//----------------------------------------------------------------------------------------------------------------------------------------------------------------

// Step 1: populate the time and date fields
let dateObj = {};
function formatData() {
    let timesJson = new Set();
    let idObj = {};
    for (let i = 0; i < totalemployees; i++) {
        idObj[i + 1] = 0;
    }
    // let dateObj = {};
    for (let i = 0; i < datafixed.length; i++) {
        const date = datafixed[i].date;
        const time = datafixed[i].time;
        const id = datafixed[i].id;
        if (!dateObj[date]) {
            dateObj[date] = {};
            dateObj[date][id] = [time];
        } else {
            if (!dateObj[date][id]) dateObj[date][id] = [time];
            else dateObj[date][id].push(time);
        }
        timesJson.add(dateObj[date]);
    }
    timesJson = Array.from(timesJson);
    return timesJson;
}

const times = formatData();

// Step 2: calculate late days from formatted data
function calculateLateDays() {
    const idLateDaysCount = {}
    for (let i = 0; i < totalemployees; i++) {
        idLateDaysCount[i + 1] = 0;
    }
    for (let i = 0; i < times.length; i++) {
        for (let j = 1; j <= totalemployees; j++) {
            if (!times[i][j]) continue
            else {
                times[i][j].sort(function (a, b) {
                    return a - b
                });
                if (times[i][j][0] > 101500) idLateDaysCount[j] += 1;
            }
        }
    }
    return idLateDaysCount;
}

const LateDaysCount = calculateLateDays();


//----------------------------------------------------------------------------------------------------------------------------------------------------------------
// EARLY LEAVE DAYS     **(MISSED LUNCH DAYS ARE ALSO CALCULATED INSIDE)
//----------------------------------------------------------------------------------------------------------------------------------------------------------------
const missedlunch = {}
function calculateEarlyLeaveDays(){
    const early = {};
    for(let i = 1; i<=totalemployees; i++){
        early[i] = 0;
        missedlunch[i] = 0;
    }
    for(let i = 0; i<times.length; i++){
        for(let j= 1; j<=totalemployees; j++){
            if(times[i][j]) {
                if (times[i][j][times[i][j].length - 1] < 174500) early[j] += 1;
                if(times[i][j].length<=2) missedlunch[j]+=1;
            }
        }
    }
    return early;
}
const early = calculateEarlyLeaveDays();


//----------------------------------------------------------------------------------------------------------------------------------------------------------------
// DAILY IN AND OUT TIMES:
//----------------------------------------------------------------------------------------------------------------------------------------------------------------

const dates = Object.keys(dateObj);
let daily = [];
for(let i = 0; i<times.length; i++){
    for(let j = 1; j<=totalemployees; j++){
        if(times[i][j]){
            let day = {};
            day["id"] = j;
            day["checkIn"] = times[i][j][0];
            day["checkOut"] = times[i][j][times[i][j].length-1];
            day["date"] = dates[i];
            daily.push(day);
        }
    }
}

//---------------------------------------------------------------------------------------------------------------------------------------------------------------
// TOTAL NUMBER OF WORKING HOURS:       **(DAILY AVERAGE WORKING HOURS IS ALSO CALCULATED INSIDE)
//---------------------------------------------------------------------------------------------------------------------------------------------------------------
const totalhour = {};
const workcount = {};
const avgworkinghour = {};
function calculateTotalWorkingHours(){
    for(let i = 1; i<=totalemployees; i++){
        totalhour[i] = 0;
        workcount[i] = 0;
        avgworkinghour[i] = 0;
    }
    for(let i = 0; i<times.length; i++){
        for(let j = 1; j<=totalemployees; j++){
            if(times[i][j]){
                let count = 0;
                while(count<times[i][j].length){
                    totalhour[j]+= (times[i][j][count+1]-times[i][j][count])/10000;
                    workcount[j]+=1;
                    count+=2;
                }
            }
        }
    }
    for(let i = 1; i<=totalemployees; i++){
        avgworkinghour[i] = totalhour[i]/presentDays[i].size;
    }
}
calculateTotalWorkingHours();

//---------------------------------------------------------------------------------------------------------------------------------------------------------------
// AVERAGE LUNCH DURATION:          **(AVERAGE LUNCH DURATION IS ALSO CALCULATED)
//---------------------------------------------------------------------------------------------------------------------------------------------------------------

const lunchcount ={};
const averagelunchduration = {};
for(let i = 1; i<=totalemployees; i++){
    lunchcount[i] = 0;
    averagelunchduration[i] = 0;
}
function calculateTotalLunchTime(){
    for(let i = 0; i<times.length; i++){
        for(let j = 1; j<=totalemployees; j++){
            if(times[i][j]){
                let count = 1;
                while(count<times[i][j].length && (count+1)<times[i][j].length){
                    averagelunchduration[j]+= (times[i][j][count+1]-times[i][j][count])/10000;
                    lunchcount[j]+=1;
                    count+=2;
                }
            }
        }
    }
    for(let i = 1; i<=totalemployees; i++){
        averagelunchduration[i] = averagelunchduration[i]/(times.length-missedlunch[i]);
    }
}
calculateTotalLunchTime();


//----------------------------------------------------------------------------------------------------------------------------------------------------------------
// REFORMAT TIME:
//----------------------------------------------------------------------------------------------------------------------------------------------------------------

function timeFormatter(val){
    val = ((Math.round(val/100))/100).toFixed(2);
    val = `${val}`
    return val.replace(".", ":");
}





//----------------------------------------------------------------------------------------------------------------------------------------------------------------
// FORMAT HTML TABLES
//----------------------------------------------------------------------------------------------------------------------------------------------------------------

totalDays.innerHTML =  `TOTAL WORKING DAYS: ${times.length}`

// DATE TABLE:
for (let i = 0; i < Object.keys(presentDays).length; i++) {
    let row = datetable.insertRow(i);
    let cell1 = row.insertCell(0);
    let cell2 = row.insertCell(1);
    let cell3 = row.insertCell(2);
    let cell4 = row.insertCell(3);
    let cell5 = row.insertCell(4);
    let cell6 = row.insertCell(5);
    let cell7 = row.insertCell(6);
    let cell8 = row.insertCell(7);
    let cell9 = row.insertCell(8);
    let cell10 = row.insertCell(9);
    cell1.innerHTML = `${Object.keys(presentDays)[i]}`;
    cell2.innerHTML = `${presentDays[i + 1].size}`;
    cell3.innerHTML = `${LateDaysCount[i + 1]}`;
    cell4.innerHTML = `${times.length-presentDays[i+1].size}`;
    cell5.innerHTML = `${early[i+1]}`;
    cell6.innerHTML = `${missedlunch[i+1]}`;
    cell7.innerHTML = `${totalhour[i+1].toFixed(2)}`;
    cell8.innerHTML = `${averagelunchduration[i+1].toFixed(2)}`;
    cell9.innerHTML = `${lunchcount[i+1]}`;
    cell10.innerHTML = `${avgworkinghour[i+1].toFixed((2))}`;
}

// DAILY IN AND OUT TABLE:
for(let i = 0; i<daily.length; i++){
    let  row = dailytable.insertRow(i);
    let cell1 = row.insertCell(0);
    let cell2 = row.insertCell(1);
    let cell3 = row.insertCell(2);
    let cell4 = row.insertCell(3);
    cell1.innerHTML = `${daily[i].date}`;
    cell2.innerHTML = `${daily[i].id}`;
    cell3.innerHTML = `${timeFormatter(daily[i].checkIn)}`;
    cell4.innerHTML = `${timeFormatter(daily[i].checkOut)}`;
}

console.timeEnd("execution time")