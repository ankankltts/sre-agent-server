export const analyzeLogs=(logs)=>{
    if(logs.includes("rf-alram:5")){
          return "insulation issue need to create work order and send technician at site to clear CCU board"
    }
    if(log.includes("return:400")){
        return "restart the nayax module"
    }

    return "no clear issue detetcted"
}

