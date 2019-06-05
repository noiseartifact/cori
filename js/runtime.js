unitePaths = function(paths) {
    var union;
    
    for (var childIndex = 0; childIndex < paths.length; childIndex++) {
        var child = paths[childIndex]
        
        if (!union) {
            union = child;
        } else {
            union = union.unite(child);
        }
    }
    
    return union;
}

function generatePositions(n) {
    // var min = [0, 0]
    var positions = []
    for (var i = 0; i < n; i++) {
        positions.push(Point.random() * project.view.viewSize)
    }

    return positions
}




// var url = 'assets/gradient-square.png';
// var raster = new Raster(url, project.view.center);
var ballPositions = generatePositions(5)
var destinations = Array.from(ballPositions)

var handle_len_rate = 2.4;
var circlePaths = [];

for (var i = 0, l = ballPositions.length; i < l; i++) {
	var circlePath = new Path.Circle({
		center: ballPositions[i],
		radius: Math.floor(Math.random() * 300) + 25
	});
	circlePaths.push(circlePath);
}
ballPositions = []

var connections = [];
function renderMask(paths) {
    // Remove the last connection paths:
    connections.map(function (path) {
        path.remove()
    })
	connections = [];

	for (var i = 0, l = paths.length; i < l; i++) {
		for (var j = i - 1; j >= 0; j--) {
			var path = metaball(paths[i], paths[j], 0.6, handle_len_rate, 300);
			if (path) {
				connections.push(path);
            }
		}
    }
    
    return connections.concat(paths)
}

function animate(paths) {
    for (var i = 0; i < paths.length; i++) {
        var item = paths[i]
        // console.warn(item.position)
        var vector = destinations[i] - item.position;
        // We add 1/30th of the vector to the position property
        // of the text item, to move it in the direction of the
        // destination point:
        item.position += vector / 300;
        // item.position += [Math.random() * 20 - 10, Math.random() * 2 - 1]
        
        // Set the content of the text item to be the length of the vector.
        // I.e. the distance it has to travel still:
        
        // If the distance between the path and the destination is less
        // than 5, we define a new random point in the view to move the
        // path to:
        if (vector.length < 100) {
            destinations[i] = Point.random() * project.view.viewSize;
        }
    }
}

function onFrame(event) {
    if (group) {
    animate(circlePaths)
    // metaball it up
    unified = unitePaths(renderMask(circlePaths))
    group.removeChildren()
    group.addChild(unified)
    group.addChild(bg)
    group.clipped = true
    }
}

function onResize(event) {
    if (bg) {
        bg.scale(project.view.viewSize.width / bg.bounds.width, project.view.viewSize.height / bg.bounds.height)
        bg.position = project.view.center
    }
}
var bg
var group
var unified
project.importSVG('assets/gradient.svg', function (item) {
    console.warn('got svg')
    bg = item
    bg.scale(project.view.viewSize.width / bg.bounds.width, project.view.viewSize.height / bg.bounds.height)
    bg.position = project.view.center
    unified = unitePaths(renderMask(circlePaths))
    group = new Group({
        children: [unified, item],
        clipped: true
    })
})




// Ported from original Metaball script by SATO Hiroyuki
// http://park12.wakwak.com/~shp/lc/et/en_aics_script.html
// ---------------------------------------------
function metaball(ball1, ball2, v, handle_len_rate, maxDistance) {
    var center1 = ball1.position;
    var center2 = ball2.position;
    var radius1 = ball1.bounds.width / 2;
    var radius2 = ball2.bounds.width / 2;
    var pi2 = Math.PI / 2;
    var d = center1.getDistance(center2);
    var u1, u2;

    if (radius1 == 0 || radius2 == 0)
        return;

    if (d > maxDistance || d <= Math.abs(radius1 - radius2)) {
        return;
    } else if (d < radius1 + radius2) { // case circles are overlapping
        u1 = Math.acos((radius1 * radius1 + d * d - radius2 * radius2) /
            (2 * radius1 * d));
        u2 = Math.acos((radius2 * radius2 + d * d - radius1 * radius1) /
            (2 * radius2 * d));
    } else {
        u1 = 0;
        u2 = 0;
    }

    var angle1 = (center2 - center1).getAngleInRadians();
    var angle2 = Math.acos((radius1 - radius2) / d);
    var angle1a = angle1 + u1 + (angle2 - u1) * v;
    var angle1b = angle1 - u1 - (angle2 - u1) * v;
    var angle2a = angle1 + Math.PI - u2 - (Math.PI - u2 - angle2) * v;
    var angle2b = angle1 - Math.PI + u2 + (Math.PI - u2 - angle2) * v;
    var p1a = center1 + getVector(angle1a, radius1);
    var p1b = center1 + getVector(angle1b, radius1);
    var p2a = center2 + getVector(angle2a, radius2);
    var p2b = center2 + getVector(angle2b, radius2);

    // define handle length by the distance between
    // both ends of the curve to draw
    var totalRadius = (radius1 + radius2);
    var d2 = Math.min(v * handle_len_rate, (p1a - p2a).length / totalRadius);

    // case circles are overlapping:
    d2 *= Math.min(1, d * 2 / (radius1 + radius2));

    radius1 *= d2;
    radius2 *= d2;

    var path = new Path({
        segments: [p1a, p2a, p2b, p1b],
        style: ball1.style,
        closed: true
    });
    var segments = path.segments;
    segments[0].handleOut = getVector(angle1a - pi2, radius1);
    segments[1].handleIn = getVector(angle2a + pi2, radius2);
    segments[2].handleOut = getVector(angle2b - pi2, radius2);
    segments[3].handleIn = getVector(angle1b + pi2, radius1);
    return path;
}

// ------------------------------------------------
function getVector(radians, length) {
    return new Point({
        // Convert radians to degrees:
        angle: radians * 180 / Math.PI,
        length: length
    });
}