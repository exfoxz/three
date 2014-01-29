/**
 * Created by ExFoxZ on 1/20/14.
 */
(function(){

//create global vars
    var scene, camera, light, renderer, controls, container, guiController, object, geometry;
    scene = new THREE.Scene();
    var myCoordinates = [], myFaces = [], lines;
    var numGeometry = 0, numTopology = 0;
    var startGeometry = 0, startTopology = 0;

    //range of looking for GEOMETRY and TOPOLOGY
    var RANGE = 30;

//wait for window to load to actually start

    window.onload = function () {
        getData();
    }

    /** GET server's triangles data file and store it */
    function getData() {
        $.ajax({
            type:    "GET",
            url:     "/three/data/1bzx.SURF",
            success: function(text) {
                // `text` is the file text
                //split file into different lines
                lines = text.split("\n");

                //get the GEOMETRY position
                for(var i = 0; i < RANGE; i++) {
                    if(lines[i].charAt(0) == "G") {
                        console.log("THIS IS IT: " + i);
                        startGeometry = i;
                        break;
                    }
                }

                //get number of geometries
                numGeometry = parseInt(lines[startGeometry].replace("GEOMETRY: ", ""))

                //split each line into different words separated by a space " "
                //words will be contained in an object - words
                //loop through lines[] to break down lines into words[]
                var words = [];
                for (i = 0; i < numGeometry; i++) {
                    words[i] = lines[i+startGeometry + 1].split(" ");
                }

                //a counter to loop through words[]
                var counter = 0;

                //loop through words[] to add parsed-Floats to myCoordinates[]
                for (var j = 0; j < words.length; j++) {
                    for(var k = 0; k < words[0].length; k++) {
                        myCoordinates[counter] = parseFloat(words[j][k]);
                        counter++;
                    }
                }
                ////START LOOKING FOR FACES - TOPOLOGY

                //get the TOPOLOGY position
                var startTopology = 0;
                for(j = numGeometry - 1 + startGeometry; j < numGeometry - 1 + startGeometry + RANGE; j++) {
                    if(lines[j].charAt(0) == "T") {
                        console.log("THIS IS TOPOLOGY: " + j);
                        startTopology = j;
                        break;
                    }
                }

                //get number of topologies
                numTopology = parseInt(lines[startTopology].replace("TOPOLOGY: ", ""));
                words = [];
                for (i = 0; i < numTopology; i++) {
                    words[i] = lines[i+ startTopology + 1].split(" ");
                }

                //reset counter
                counter = 0;

                //loop through words[] to add parsed-Floats to myCoordinates[]
                for (j = 0; j < words.length; j++) {
                    for(k = 0; k < words[0].length; k++) {
                        myFaces[counter] = parseFloat(words[j][k]);
                        counter++;
                    }
                }
                console.log("BEFORE START");
                console.log(myFaces);
                console.log(myCoordinates);
                //start rendering after getting the information
                start();
            },
            error:   function(e) {
                // An error occurred
                console.log(e);
            }
        });
    }
    /** start function */

    function start() {
        init();
        initGeometry();
        render();
        //setupGui();
        animate();
    }


    /** Initialize variables and scenes */

    function init() {

        var WIDTH = window.innerWidth,
            HEIGHT = window.innerHeight;
        var VIEW_ANGLE = 45,
            ASPECT = WIDTH/HEIGHT,
            NEAR = 0.1,
            FAR = 1000;

        renderer = new THREE.WebGLRenderer({antialias:true});
        renderer.setSize(WIDTH, HEIGHT);

        document.body.appendChild(renderer.domElement);

        camera =
            new THREE.PerspectiveCamera(
                VIEW_ANGLE, ASPECT, NEAR, FAR
            );
        camera.position.set(0, 0, 300);

        //add the camera to scene

        scene.add(camera)

        light = new THREE.PointLight(0xFFFFFF, 0.8);
        light.position.set(0,30,30);
        scene.add(light);

        //var light2 = new THREE.DirectionalLight(0xFFFFFF);
        //light2.position.set(15, 10, 5);
        //var lightH = new THREE.DirectionalLightHelper(light2,10);

        //var spotLight = new THREE.SpotLight(0xFFFFFF, 1.0);
        //spotLight.position.set(0,200,0);
        //spotLight.castShadow = true;
        //spotLight.target
        //var spotLightH = new THREE.SpotLightHelper(spotLight, 2);

        //scene.add(spotLight);
        //scene.add(spotLightH);
        //scene.add(light2);
        //scene.add(lightH);
        //add controls

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        var axisHelper = new THREE.AxisHelper(5);
        scene.add(axisHelper);

        //var size = 10;
        //var step = 1;
        //var gridHelper = new THREE.GridHelper( size, step );
        //scene.add( gridHelper );
    }

    /** Initialize geometry from server data */

    function initGeometry() {
        //making a mesh
        var radius = 25,
            segments = 16,
            rings = 16;

        var sphere = new THREE.Mesh(
            new THREE.SphereGeometry(radius, segments, rings), myMaterial
        );

        var myMaterial =
            new THREE.MeshLambertMaterial({
                color: 0xFFFFFF,
                //side: THREE.DoubleSide
            });

        geometry = new THREE.Geometry();

        //loop to add vertices
        for (var i = 0; i< myCoordinates.length; i+=6) {
            addVertex(myCoordinates[i], myCoordinates[i+1], myCoordinates[i+2])
            //addVertex(myLines[i]-xPrime, myLines[i+1]-yPrime, myLines[i+2]-zPrime);
        }

        for (var j = 0; j< myFaces.length; j+=3) {
            addFace(myFaces[j], myFaces[j+1], myFaces[j+2]);
        }

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        //findPrime function to find xP, yP and zP

        var primeArray = findPrime();

        //create a new object containing geometry
        object = new THREE.Mesh(geometry, myMaterial);
        object.position.set(-primeArray[0], -primeArray[1], -primeArray[2]);
        scene.add(object);

        var litCube = new THREE.Mesh(
            new THREE.CubeGeometry(20,20,20),
            new THREE.MeshLambertMaterial({color: 0xFFFFFF})
        );
        litCube.castShadow = true;
        litCube.receiveShadow = true;
        litCube.position.y = -30;
        scene.add(litCube);

        function addVertex(x, y, z) {
            geometry.vertices.push( new THREE.Vector3( x, y, z) );
        }

        function addFace(x, y, z) {
            geometry.faces.push( new THREE.Face3( x, y, z));
        }
    }

    /** render from geometry information */

    function render() {
        light.position.copy ( camera.position );
        //camera.updateProjectionMatrix();
        renderer.render(scene, camera);
    }

    /** animate by looping with requestAnimationFrame */
    function animate() {
        controls.update();
        //update camera.lookAt
        camera.lookAt(scene.position);
        render();
        window.requestAnimationFrame(animate, renderer.domElement);
    }

    /** setup simple gui */

    function setupGui () {
        console.log("SETUP GUI");
        guiController = {
            viewAngle: 45
        }
        var gui = new DAT.GUI({autoPlace: false});
        var element = gui.add( guiController, "viewAngle", 10, 90);
        element.name("View Angle");
        element.onFinishChange(function(){
            camera.fov = guiController.viewAngle;
            camera.updateProjectionMatrix();
            console.log("Change");
        })
        //renderer.domElement.appendChild(gui.domElement);
    }
    function findPrime () {
        var xPrime = 0, yPrime = 0, zPrime = 0;
        for (var i = 0; i < myCoordinates.length - 6; i+=6) {
            xPrime += myCoordinates[i];
            yPrime += myCoordinates[i+1];
            zPrime += myCoordinates[i+2];
        }
        return [xPrime/numGeometry,yPrime/numGeometry,zPrime/numGeometry];
    }















    function init2() {
        console.log("This is init");
        scene = new THREE.Scene();
        var WIDTH = window.innerWidth;
        var HEIGHT = window.innerHeight;
        var material = new THREE.MeshBasicMaterial({color: 0xFF0000, side: THREE.DoubleSide});
        var geometry = new THREE.Geometry();

        //add container to DOM Element
        //container = document.getElementById('canvas');
        //document.body.appendChild(container);

        renderer = new THREE.WebGLRenderer({antialias:true});
        renderer.setSize(WIDTH, HEIGHT);
        renderer.gammaInput = true;
        renderer.gammaOutput = true;
        document.body.appendChild(renderer.domElement);
        //container.appendChild(renderer.domElement);


        camera = new THREE.PerspectiveCamera( 45, WIDTH/HEIGHT, 1, 500 );
        camera.position.set( 23.166759, 3.030500, 39.191000 );
        scene.add(camera);

        //change aspect when the window is resized
        window.addEventListener('resize', function () {
            var WIDTH = window.innerWidth;
            var HEIGHT = window.innerHeight;
            renderer.setSize(WIDTH,HEIGHT);
            camera.aspect.set(WIDTH/HEIGHT);
            camera.updateProjectionMatrix();
        });

        //set background color of the scene.
        renderer.setClearColor(0xFFFFFF,1);

        //create a light, set its position, and add it to the scene
        light = new THREE.PointLight(0xFFFFFF, 1.0);
        scene.add(light);

        //controller for DAT.GUI

        //add vertices and faces
        addVertex(23.166759, 3.030500, 39.191000);
        addVertex(23.162279, 3.530500, 38.691000);
        addVertex(23.048153, 3.530500, 39.191000);
        addFace(0, 1, 2);

        mesh = new THREE.Mesh( geometry, material);
        scene.add(mesh);

        //camera.lookAt( mesh );
        //var newQuaternion = new THREE.Quaternion();

        // Add OrbitControls so that we can pan around with the mouse.
        controls = new THREE.OrbitControls(camera, renderer.domElement);

        function addVertex(x, y, z) {
            geometry.vertices.push( new THREE.Vector3( x, y, z) );
        }

        function addFace(x, y, z) {
            geometry.faces.push( new THREE.Face3(x, y, z));
        }
        // Renders the scene and updates the render as needed.

    }

})();