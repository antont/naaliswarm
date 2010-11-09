print('Box...');

const XLIMIT = 50.0;
const YLIMIT = 50.0;
const ZLIMIT = 50.0;
const Z      = 50.0;
const Y      = 30.0;
const MAXSPEED = 25;
const MAXSTEERING = 0.05;

const MINDIST = 3.00;
const SLOWDOWNDIST = 20.00;

//var speed = MAXSPEED;
var target = null;

//Init();

var velocity = null;

delayed = frame.DelayedExecute(0.1);
delayed.Triggered.connect(Init);

function Init() {
    target = GetNewTarget();
    velocity = new Vector3df();
    velocity.x = 5.0;
    velocity.y = 2.0;
    
    var pl = me.placeable;
    var tm = pl.transform;
    
    initPos = new Vector3df();
    initPos.x = 0.0;
    initPos.y = Y;
    initPos.z = Z;
    //pl.Translate(initPos);
    
    tm.pos = initPos;
    pl.transform = tm;

    //PrintVector(pl.transform.pos);
    
    frame.Updated.connect(Update);
}


function Update(dt) {
    try {
        var pl = me.placeable;
        var tm = pl.transform;
        
        
        var location = tm.pos;
        var steer = Steer(target, location);
        //print(GetMagnitude(steer));
        velocity = VectorSum(velocity, steer);
        velocity = GetLimitedVector(velocity, MAXSPEED);
        //print(GetMagnitude(velocity)); //speed
        var delta = VectorMult(velocity, dt);
        
        
        //var speed = MAXSPEED;
        var distanceToTarget = GetDistance(tm.pos, target);
        if(distanceToTarget < MINDIST) {
            target = GetNewTarget();
        }
        //else if(distanceToTarget < SLOWDOWNDIST) {
        //    speed = distanceToTarget*speed/SLOWDOWNDIST;
        //}
        
        //var direction = new Vector3df();
        //direction.x = target.x - tm.pos.x;
        //direction.y = target.y - tm.pos.y;
        //direction.z = target.z - tm.pos.z;
        //
        //direction = GetUnitVector(direction);
        
        //newPos = new Vector3df();
        //newPos.x = tm.pos.x + direction.x*speed*dt;
        //newPos.y = tm.pos.y + direction.y*speed*dt;
        //newPos.z = tm.pos.z + direction.z*speed*dt;
        var newPos = VectorSum(location, delta);
        //print(GetMagnitude(velocity));
        
        
        
        tm.pos = newPos;
        pl.transform = tm;
        
    }
    catch(e) {
        print(e.message);
    }
}

function Steer(target, location) {
    var steer = null;
    var desired = VectorSub(target, location);
    var distance = GetMagnitude(desired);
    print(distance);
    if(distance > 0) {
        desired = GetUnitVector(desired);
        //desired = VectorMult(desired, MAXSPEED);
        if( distance < SLOWDOWNDIST ) {
            desired = VectorMult(desired, MAXSPEED*(distance/SLOWDOWNDIST));
        }
        else {
            desired = VectorMult(desired, MAXSPEED);
        }
        steer = VectorSub(desired, velocity);
        steer = GetLimitedVector(steer, MAXSTEERING);
    }
    else {
        steer = new Vector3df();
    }
    return steer;
}

function GetNewTarget() {
    var e = scene.GetEntityRaw(5)
    var p = e.placeable;
    var tm = p.transform;

    t = new Vector3df();
    t.x = Math.random()*XLIMIT;
    t.y = Math.random()*YLIMIT;
    t.z = Math.random()*ZLIMIT; //Z;
    //print('New target');
    //PrintVector(t);
    
    tm.pos = t;
    p.transform = tm;
    
    return t;
}

function GetLimitedVector(v, limit) {
    var l = GetMagnitude(v);
    if(l > limit) {
        v = GetUnitVector(v);
        v = VectorMult(v, limit);
    }
    return v;
}

function VectorMult(v, i) {
    u = new Vector3df();
    u.x = v.x*i;
    u.y = v.y*i;
    u.z = v.z*i;
    return u;
}

function VectorSum(v1, v2) {
    u = new Vector3df();
    u.x = v1.x + v2.x;
    u.y = v1.y + v2.y;
    u.z = v1.z + v2.z;
    return u;
}

// v1 - v2
function VectorSub(v1, v2) {
    u = new Vector3df();
    u.x = v1.x - v2.x;
    u.y = v1.y - v2.y;
    u.z = v1.z - v2.z;
    return u;
}

function GetUnitVector(v) {
    u = new Vector3df();
    var l = GetMagnitude(v);
    
    u.x = v.x/l;
    u.y = v.y/l;
    u.z = v.z/l;
    
    return u;
}


function GetMagnitude(v) {
    return Math.sqrt(Math.pow(v.x,2) + Math.pow(v.y,2) + Math.pow(v.z, 2));
}

function GetDistance(v1, v2) {
    return Math.sqrt(Math.pow((v1.x-v2.x),2) + Math.pow((v1.y-v2.y),2) + Math.pow((v1.x-v2.x),2));
}

function PrintVector(v) {
    print(v.x+' '+v.y+' '+v.z);
}
