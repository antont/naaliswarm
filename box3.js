engine.IncludeFile('D:\\Antti\\lvm\\vector.js');

print('Script..');

const LIMIT = 10.0;

const AREALIMIT = 50.0;

const MAXSPEED = 15.0;
const MAXSTEERING = 1.0;


delayed = frame.DelayedExecute(0.1);
delayed.Triggered.connect(Init);

var boxes = []
var averageLocation = new Vector3df();
var averageVelocity = new Vector3df();

function Init() {
    print('Init..');
    try {
        frame.Updated.connect(UpdateAverage);
        
        var meshEntity = scene.GetEntityRaw(2);
        for( var i = 0; i < 8; i++ ) {
            var id = scene.NextFreeIdLocal();
            var entity = scene.CreateEntityRaw(id, ['EC_Placeable', 'EC_Mesh']);
            entity.SetName('Box '+i);
            var placeable = entity.GetOrCreateComponentRaw('EC_Placeable');
            var mesh = entity.mesh;
            
            //mesh.meshResourceId = meshEntity.mesh;
            //mesh.SetMesh(meshEntity.mesh.GetMeshName());
            //mesh.SetMaterial(0, meshEntity.mesh.GetMaterialName(0));
            
            //var mesh = entity.GetOrCreateComponentRaw('EC_Mesh');
            //mesh.AutoSetPlaceable();
            //mesh.SetDrawDistance(0);
            mesh.SetMesh('file://boxA.mesh');
            mesh.SetMaterial(0, 'C:\\Naali_trunk\\bin\\data\\assets\\crate_texture.material');
            //var scale = new Vector3df();
            //scale.x = 0.2; scale.y = 0.2; scale.z = 0.2;
            //mesh.SetAdjustScale(scale);
            
            scene.EmitEntityCreated(entity);
            var b = new Box(id);
            boxes.push(b);
        }
        
        //for( var i = 2; i < 11; i++ ) {
        //    var b = new Box(i);
        //    boxes.push(b);
        //}
    }
    catch(e) {
        print(e.message);
    }
}

function UpdateAverage(dt) {
    var aLoc = new Vector3df();
    var aVel = new Vector3df();
    for ( var i in boxes ) {
        var l = boxes[i].GetLocation();
        var v = boxes[i].velocity;
        aLoc.x += l.x;
        aLoc.y += l.y;
        aLoc.z += l.z;
        
        aVel.x += v.x;
        aVel.y += v.y;
        aVel.z += v.z;
    }
    var len = boxes.length;
    if(len > 0) {
        aLoc.x = aLoc.x/len;
        aLoc.y = aLoc.y/len;
        aLoc.z = aLoc.z/len;
        
        aVel.x = aVel.x/len;
        aVel.y = aVel.y/len;
        aVel.z = aVel.z/len;
    }
    averageLocation = aLoc;
    averageVelocity = aVel;
    PrintVector(averageVelocity);
    
}

function Box(entityId) {
    this.entityId   = entityId;
    this.entity     = scene.GetEntityRaw(entityId);
    this.velocity   = GetRandomVector(MAXSPEED);
    //this.wander1    = 0.0;
    //this.wander2    = 0.0;
    
    var placeable = this.entity.placeable;
    var transform = placeable.transform;
    transform.pos = GetRandomVector(LIMIT);
    placeable.transform = transform;
    
    
    frame.Updated.connect(this, this.Update);

}



Box.prototype.Update = function(dt) {
    try {
        var pl = this.entity.placeable;
        var tm = pl.transform;

        var location = tm.pos;
        
        acc = this.Flock();
        acc = VectorSum(acc, VectorMult(this.AreaBounds(), 2));
        
        //acc = VectorSum(acc, this.Steer(averageLocation, location));
        //acc = VectorSum(acc, this.Steer(averageVelocity, location));
        //acc = VectorSum(acc, this.Steer(this.AvoidOthers(location), location));


        //var steer = this.Steer(acc, location);
        
        this.velocity = VectorSum(this.velocity, acc);
        this.velocity = GetLimitedVector(this.velocity, MAXSPEED);

        var delta = VectorMult(this.velocity, dt);
        
        var newPos = VectorSum(location, delta);     
        
        
        tm.pos = newPos;
        pl.transform = tm;
        
    }
    catch(e) {
        print(e.message);
    }
}

Box.prototype.AreaBounds = function() {
    var location = this.GetLocation();
    var steer = new Vector3df();
    var target = new Vector3df();
    target.x = 0; target.y = 0; target.z = 0;
    if( location.x < -AREALIMIT || location.x > AREALIMIT ||
        location.y < -AREALIMIT || location.x > AREALIMIT ||
        location.z < -AREALIMIT || location.z > AREALIMIT ) {
        steer = this.Steer(target, false);
    }
    return steer;
}

Box.prototype.Flock = function() {
    var acc = new Vector3df();
    var sep = VectorMult(this.FlockSeparate(), 1.5);
    var ali = this.FlockAlign();
    var coh = VectorMult(this.FlockCohesion(), 1.1);
    
    acc = VectorSum(acc, sep);
    acc = VectorSum(acc, ali);
    acc = VectorSum(acc, coh);
    return acc;
}

Box.prototype.FlockSeparate = function() {
    var desiredSeparation = 5.0;
    var location = this.GetLocation();
    var steer = new Vector3df();
    var count = 0;
    for( var i in boxes ) {
        var other = boxes[i];
        var otherLocation = other.GetLocation();
        var dist = GetDistance(location, otherLocation);
        if( dist > 0 && dist < desiredSeparation ) {
            var diff = VectorSub(location, otherLocation);
            diff = GetUnitVector(diff);
            diff = VectorDiv(diff, dist);
            steer = VectorSum(steer, diff);
            count += 1;
        }
    }
    if( count > 0 ) {
        steer = VectorDiv(steer, count);
    }
    if( GetMagnitude(steer) > 0 ) {
        steer = GetUnitVector(steer);
        steer = VectorMult(steer, MAXSPEED);
        steer = VectorSub(steer, this.velocity);
        steer = GetLimitedVector(steer, MAXSTEERING);
    }
    return steer;
}

// Average velocity
Box.prototype.FlockAlign = function() {
    var neighborDist = 10.0;
    var location = this.GetLocation();
    var steer = new Vector3df();
    var count = 0;
    for( var i in boxes ) {
        var other = boxes[i];
        var otherLocation = other.GetLocation();
        var dist = GetDistance(location, otherLocation);
        if( dist > 0 && dist < neighborDist ) {
            steer = VectorSum(steer, other.velocity);
            count += 1;
        }
    }
    if( count > 0 ) {
        steer = VectorDiv(steer, count);
    }
    if( GetMagnitude(steer) > 0 ) {
        steer = GetUnitVector(steer);
        steer = VectorMult(steer, MAXSPEED);
        steer = VectorSub(steer, this.velocity);
        steer = GetLimitedVector(steer, MAXSTEERING);
    }
    return steer;
}
//Box.prototype.FlockAlign = function() {
//    var steer = VectorSum(steer, averageVelocity);
//    if( GetMagnitude(steer) > 0 ) {
//        steer = GetUnitVector(steer);
//        steer = VectorMult(steer, MAXSPEED);
//        steer = VectorSub(steer, this.velocity);
//        steer = GetLimitedVector(steer, MAXSTEERING);
//    }
//    return steer;
//}

// Average position
Box.prototype.FlockCohesion = function() {
    var neighborDist = 10.0;
    var location = this.GetLocation();
    var sum = new Vector3df();
    var count = 0;
    for( var i in boxes ) {
        var other = boxes[i];
        var otherLocation = other.GetLocation();
        var dist = GetDistance(location, otherLocation);
        if( dist > 0 && dist < neighborDist) {
            sum = VectorSum(sum, otherLocation);
            count += 1;
        }
    }
    if( count > 0 ) {
        sum = VectorDiv(sum, count);
        return this.Steer(sum, false);
    }
    return sum;
}


//Box.prototype.AvoidOthers = function(location) {
//    a = new Vector3df();
//    for ( var i in boxes ) {
//        if(boxes[i].entityId == this.id) {
//            continue;
//        }
//        var bLoc = boxes[i].GetLocation();
//        var bDist = GetDistance(location, bLoc);
//        if( bDist < 3 ) {
//            var diff = VectorSub(location, bLoc);
//            
//            a = VectorSum(a, VectorSub(location, bLoc));
//        }
//    }
//    //PrintVector(a);
//    return a;
//}

Box.prototype.GetLocation = function() {
    var pl = this.entity.placeable;
    var tm = pl.transform;
    return tm.pos;
}

//Box.prototype.WanderTarget = function(location) {
//    var wanderR = 3.0;
//    var wanderD = 5.0;
//    this.wander1 += (Math.random()-Math.random())*0.25;
//
//    var circleLoc = GetUnitVector(this.velocity);
//    circleLoc = VectorMult(circleLoc, wanderD);
//    circleLoc = VectorSum(circleLoc, location);
//    
//    var circleOffset = new Vector3df();
//    circleOffset.x = wanderR*Math.sin(this.wander1)*Math.cos(this.wander2);
//    circleOffset.y = wanderR*Math.sin(this.wander1)*Math.sin(this.wander2);
//    circleOffset.z = wanderR*Math.cos(this.wander1);
//    
//    var s = VectorSum(circleLoc, circleOffset);
//    PrintVector(s);
//    return s;
//}


Box.prototype.Steer = function(target, slowDown) {
    var steer = null;
    var location = this.GetLocation()
    var desired = VectorSub(target, location);
    var distance = GetMagnitude(desired);
    //print(distance);
    if(distance > 0) {
        desired = GetUnitVector(desired);
        if(slowDown) {
            if( distance < SLOWDOWNDIST ) {
                desired = VectorMult(desired, MAXSPEED*(distance/SLOWDOWNDIST));
            }
            else {
                desired = VectorMult(desired, MAXSPEED);
            }
        }
        else {
            desired = VectorMult(desired, MAXSPEED);
        }
        steer = VectorSub(desired, this.velocity);
        steer = GetLimitedVector(steer, MAXSTEERING);
    }
    else {
        steer = new Vector3df();
    }
    return steer;
}
