window.onload = function()
{
	var canvas = document.getElementById("myCanvas");
	var ctx = canvas.getContext("2d");
	
	canvas.width = screen.width-30;
	canvas.height = screen.height-165;
	
	document.addEventListener("keydown", keyDownHandler, false);
	document.addEventListener("keyup", keyUpHandler, false);

	var square1X = 100;
	var square1Y = 300;
	var squareSize = 30;
	var projectileSize = 10;
	var moveRight = false;
	var moveLeft = false;
	var moveUp = false;
	var moveDown = false;
	var shoot1 = false;
	var shootDelay = 1000;		// in ms
	var shoot1Enabled = true;
	var projectileOffsetFromSquare = 10;
	var projectileSpeed = 10;
	//var projectile = {x:-100, y:-100, vectorX:0, vectorY:0};
	var projectiles1 = [];
	
	draw();
	
	function keyDownHandler(e)
	{
		// d
		if(e.keyCode == 68)
			moveRight = true;
		// a
		if(e.keyCode == 65)
			moveLeft = true;
		// w
		if(e.keyCode == 87)
			moveUp = true;
		// s
		if(e.keyCode == 83)
			moveDown = true;
		// space
		if(e.keyCode == 32)
			shoot1 = true;
	}
	function keyUpHandler(e)
	{
		// d
		if(e.keyCode == 68)
			moveRight = false;
		// a
		if(e.keyCode == 65)
			moveLeft = false;
		// w
		if(e.keyCode == 87)
			moveUp = false;
		// s
		if(e.keyCode == 83)
			moveDown = false;
		// space
		if(e.keyCode == 32)
			shoot1 = false;
	}
	
	function drawText(text)
	{
		ctx.font = "20px Arial";
		ctx.fillStyle = "#eee";
		ctx.fillText(text,10,20);
	}
	
	function drawSquare()
	{
		ctx.beginPath();
		ctx.rect(square1X, square1Y, squareSize, squareSize);
		ctx.fillStyle = "#0055cc";
		ctx.fill();
		ctx.closePath();
	}
	
	function drawProjectile1()
	{
		for(var i = 0; i < projectiles1.length; i++)
		{
			// right projectile
			var x = projectiles1[i].x;
			var y = projectiles1[i].y;
			ctx.beginPath();
			ctx.rect(x, y, projectileSize, projectileSize);
			ctx.fillStyle = projectiles1[i].color;
			ctx.fill();
			ctx.closePath();
		}
		
	}
	
	function spawnProjectile()
	{
		var x1 = square1X + squareSize + projectileOffsetFromSquare;
		var y1 = square1Y + (squareSize/2) - (projectileSize/2);
		
		// unnecessary projectile coloring
		var r,g,b;
		r = g = b = 0;
		while(r+g+b < 255)
		{
			r = Math.floor((Math.random() * 255));
			g = Math.floor((Math.random() * 255));
			b = Math.floor((Math.random() * 255));
		}
		var color1 = "rgb(" + r + ", " + g + ", " + b + ")";
		
		var p = {x:x1, y:y1, vectorX:0, vectorY:0, color:color1};		// maybe read vectrs from fn parametars
		projectiles1.push(p);
		
		console.log(projectiles1);
	}
	
	function draw()
	{ 
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		// background
		ctx.beginPath();
		ctx.rect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "#222";
		ctx.fill();
		ctx.closePath();
		
		// drawing square and checks for position
		if(moveRight == true && square1X+squareSize < canvas.width)
			square1X += 5;
		if(moveLeft == true && square1X > 0)
			square1X -= 5;
		if(moveUp == true && square1Y > 0)
			square1Y -= 5;
		if(moveDown == true && square1Y+squareSize < canvas.height)
			square1Y += 5;
		
		drawSquare();
		
		
		// drawing projectile
		if(shoot1 == true && shoot1Enabled == true)
		{
			shoot1Enabled = false;
			spawnProjectile();
			setTimeout(function(){shoot1Enabled = true}, shootDelay);
		}
		drawProjectile1();
		for(var i = 0; i < projectiles1.length; i++)
		{
			projectiles1[i].x += projectileSpeed;
			
			// check for projectile collision
			if(projectiles1[i].x < 0 || projectiles1[i].y < 0 || projectiles1[i].x+projectileSize > canvas.width || projectiles1[i].y+projectileSize > canvas.height)
			{	// animate and then destroy projectile with splice
				
				// call fn projectileExplosion()
				
				projectiles1.splice(i, 1);
				
				
			}
		}
			
		
		
		// debug text
		//drawText("X: " + square1X.toFixed(2) + "   Y: " + square1Y.toFixed(2));
		
		
		
		
		
		//setInterval(draw, 10);
		requestAnimationFrame(draw);
	}
	
	
	
};