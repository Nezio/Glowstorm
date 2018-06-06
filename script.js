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
	var moveRight = false;
	var moveLeft = false;
	var moveUp = false;
	var moveDown = false;
	
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
	
	function draw()
	{ 
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		// background
		ctx.beginPath();
		ctx.rect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "#222";
		ctx.fill();
		ctx.closePath();
		
		// checks for player square
		if(moveRight == true && square1X+squareSize < canvas.width)
			square1X += 5;
		if(moveLeft == true && square1X > 0)
			square1X -= 5;
		if(moveUp == true && square1Y > 0)
			square1Y -= 5;
		if(moveDown == true && square1Y+squareSize < canvas.height)
			square1Y += 5;
		
		// drawing
		//drawText("X: " + square1X.toFixed(2) + "   Y: " + square1Y.toFixed(2));
		drawSquare();
		
		//setInterval(draw, 10);
		requestAnimationFrame(draw);
	}
	
	
};