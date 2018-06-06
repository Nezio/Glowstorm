window.onload = function ()
{
	var canvas = document.getElementById("myCanvas");
	var ctx = canvas.getContext("2d");

	document.addEventListener("keydown", KeyDownHandler, false);
	document.addEventListener("keyup", KeyUpHandler, false);

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	
	// works but players are left outside screen; update: not if width is 100%, but there is scaling problem
	window.onresize = resizeHandler;
	function resizeHandler()
	{
		//alert(window.innerWidth);		
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		// update variables
	}

	// main logic #####################################################################################################
	
	// call main draw fn which repeats itself every tick with requestAnimationFrame
	Variables();
	Draw();


	// functions #####################################################################################################
	function Variables()	// initialize and update
	{
		// general
		cw = canvas.width;			// magic constant is 0.0008; for cw * x, x = pixel_value * 0.0008
		squareSize = cw * 0.023;	// x = 0.023 ~= 30 * 0.0008
		playerSpeed = cw * 0.004;
		projectileSize = cw * 0.008;
		shootDelay = 500;								// in miliseconds; original : 1000
		projectileOffsetFromSquare = cw * 0.008;
		projectileSpeed = cw * 0.008;
		projectileDamage = 10;
		endgame = false;
		restartKey = false;

		// players should be objects; players[0] = createPlayer(X, Y, Color);
		// player 1
			// player
			square1X = cw * 0.08;
			square1Y = canvas.height / 2 - squareSize / 2;
			player1Health = 100;
			player1Color = "#0055cc";

			// movement
			moveRight = false;
			moveLeft = false;
			moveUp = false;
			moveDown = false;

			// projectile
			shoot1 = false;
			shoot1Enabled = true;
			projectiles1 = [];

		// player 2
			// player
			square2X = cw - (cw * 0.08) - squareSize;
			square2Y = canvas.height / 2 - squareSize / 2;
			player2Health = 100;
			player2Color = "#cc1100";

			// movement
			moveRight2 = false;
			moveLeft2 = false;
			moveUp2 = false;
			moveDown2 = false;

			// projectile
			shoot2 = false;
			shoot2Enabled = true;
			projectiles2 = [];
	}

	function KeyDownHandler(e)
	{
		// general
		if (endgame == true && e.keyCode == 13)
		{
			restartKey = true;
		}

		// player 1
			// d
			if (e.keyCode == 68)
				moveRight = true;
			// a
			if (e.keyCode == 65)
				moveLeft = true;
			// w
			if (e.keyCode == 87)
				moveUp = true;
			// s
			if (e.keyCode == 83)
				moveDown = true;
			// space
			if (e.keyCode == 32)
				shoot1 = true;

		// player 2
			// Arrow right
			if (e.keyCode == 39)
				moveRight2 = true;
			// Arrow left
			if (e.keyCode == 37)
				moveLeft2 = true;
			// Arrow up
			if (e.keyCode == 38)
				moveUp2 = true;
			// Arrow down
			if (e.keyCode == 40)
				moveDown2 = true;
			// Numpad 3
			if (e.keyCode == 99)
				shoot2 = true;
	}

	function KeyUpHandler(e)
	{
		// player 1
			// d
			if (e.keyCode == 68)
				moveRight = false;
			// a
			if (e.keyCode == 65)
				moveLeft = false;
			// w
			if (e.keyCode == 87)
				moveUp = false;
			// s
			if (e.keyCode == 83)
				moveDown = false;
			// space
			if (e.keyCode == 32)
				shoot1 = false;

		// player 2
			// Arrow right
			if (e.keyCode == 39)
				moveRight2 = false;
			// Arrow left
			if (e.keyCode == 37)
				moveLeft2 = false;
			// Arrow up
			if (e.keyCode == 38)
				moveUp2 = false;
			// Arrow down
			if (e.keyCode == 40)
				moveDown2 = false;
			// Numpad 3
			if (e.keyCode == 99)
				shoot2 = false;
	}

	function DrawDebugText(text)
	{
		ctx.font = "20px Arial";
		ctx.fillStyle = "#eee";
		ctx.fillText(text, 10, 20);
	}

	function DrawSquares()
	{
		// player 1
		ctx.beginPath();
		ctx.rect(square1X, square1Y, squareSize, squareSize);
		ctx.fillStyle = player1Color;
		ctx.fill();
		ctx.closePath();

		// player 2
		ctx.beginPath();
		ctx.rect(square2X, square2Y, squareSize, squareSize);
		ctx.fillStyle = player2Color;
		ctx.fill();
		ctx.closePath();

		
		// player 1 health text
		ctx.font = "12px Arial";
		ctx.fillStyle = "#eee";
		//ctx.fillText(player1Health, square1X + (squareSize / 2) - 10, square1Y - 15);

		// player 1 health bar
		ctx.beginPath();
		var w = squareSize * 1.3;
		ctx.rect(square1X - (w - squareSize) / 2, square1Y - cw * 0.01, w, cw * 0.001);
		ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
		ctx.fill();
		ctx.closePath();
		ctx.beginPath();
		var w = squareSize * 1.3;
		ctx.rect(square1X - (w - squareSize) / 2, square1Y - cw * 0.01, w*player1Health/100, cw * 0.001);
		ctx.fillStyle = "#00ff33";
		ctx.fill();
		ctx.closePath();


		// player 2 health text
		ctx.font = "12px Arial";
		ctx.fillStyle = "#eee";
		//ctx.fillText(player2Health, square2X + (squareSize / 2) - 10, square2Y - 5);

		// player 2 health bar
		ctx.beginPath();
		var w = squareSize * 1.3;
		ctx.rect(square2X - (w - squareSize) / 2, square2Y - cw * 0.01, w, cw * 0.001);
		ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
		ctx.fill();
		ctx.closePath();
		ctx.beginPath();
		var w = squareSize * 1.3;
		ctx.rect(square2X - (w - squareSize) / 2, square2Y - cw * 0.01, w*player2Health/100, cw * 0.001);
		ctx.fillStyle = "#00ff33";
		ctx.fill();
		ctx.closePath();


	}

	function DrawProjectiles()
	{
		// player 1
		for (var i = 0; i < projectiles1.length; i++)
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

		// player 2
		for (var i = 0; i < projectiles2.length; i++)
		{
			// left projectile
			var x = projectiles2[i].x;
			var y = projectiles2[i].y;
			ctx.beginPath();
			ctx.rect(x, y, projectileSize, projectileSize);
			ctx.fillStyle = projectiles2[i].color;
			ctx.fill();
			ctx.closePath();
		}

	}

	function spawnProjectile1()
	{	// player 1
		var x1 = square1X + squareSize + projectileOffsetFromSquare;
		var y1 = square1Y + (squareSize / 2) - (projectileSize / 2);

		// unnecessary projectile coloring
		var r, g, b;
		r = g = b = 0;
		while (r + g + b < 255)
		{
			r = Math.floor((Math.random() * 255));
			g = Math.floor((Math.random() * 255));
			b = Math.floor((Math.random() * 255));
		}
		var color1 = "rgb(" + r + ", " + g + ", " + b + ")";

		var p = { x: x1, y: y1, vectorX: 0, vectorY: 0, color: color1 };		// maybe read vectrs from fn parametars
		projectiles1.push(p);

	}

	function spawnProjectile2()
	{	// player 2
		var x1 = square2X - projectileOffsetFromSquare - projectileSize;
		var y1 = square2Y + (squareSize / 2) - (projectileSize / 2);

		// unnecessary projectile coloring
		var r, g, b;
		r = g = b = 0;
		while (r + g + b < 255)
		{
			r = Math.floor((Math.random() * 255));
			g = Math.floor((Math.random() * 255));
			b = Math.floor((Math.random() * 255));
		}
		var color1 = "rgb(" + r + ", " + g + ", " + b + ")";

		var p = { x: x1, y: y1, vectorX: 0, vectorY: 0, color: color1 };		// maybe read vectrs from fn parametars
		projectiles2.push(p);

	}

	function DamagePlayer1(damage)
	{
		player1Health -= damage;
	}

	function DamagePlayer2(damage)
	{
		player2Health -= damage;
	}

	function Pause()
	{
		playerSpeed = 0;
		projectileSpeed = 0;
		shoot1Enabled = false;
		shoot2Enabled = false;
	}


	function Draw()
	{
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		/*// background		// moved to css
		ctx.beginPath();
		ctx.rect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "#222";
		ctx.fill();
		ctx.closePath();*/

		// drawing square and checks for position		// maybe edit checks; this code allows squares to exit screen by squareSize
		// player 1
		if (moveRight == true && square1X + squareSize < (canvas.width /*/ 2 - squareSize*/))	// rem /2-squareSize to allow full screen movement
			square1X += playerSpeed;
		if (moveLeft == true && square1X > 0)
			square1X -= playerSpeed;
		if (moveUp == true && square1Y > 0)
			square1Y -= playerSpeed;
		if (moveDown == true && square1Y + squareSize < canvas.height)
			square1Y += playerSpeed;

		// player 2
		if (moveRight2 == true && square2X + squareSize < canvas.width)
			square2X += playerSpeed;
		if (moveLeft2 == true && square2X > canvas.width / 2)		// change canvas.width/2 to 0 to allow full screen movement
			square2X -= playerSpeed;
		if (moveUp2 == true && square2Y > 0)
			square2Y -= playerSpeed;
		if (moveDown2 == true && square2Y + squareSize < canvas.height)
			square2Y += playerSpeed;
		
		// TODO: check for collision between players

		DrawSquares();


		// drawing projectiles
		// player 1 spawn projectile
		if (shoot1 == true && shoot1Enabled == true)
		{
			shoot1Enabled = false;
			spawnProjectile1();
			setTimeout(function () { shoot1Enabled = true }, shootDelay);
		}
		// player 2 spawn projectile
		if (shoot2 == true && shoot2Enabled == true)
		{
			shoot2Enabled = false;
			spawnProjectile2();
			setTimeout(function () { shoot2Enabled = true }, shootDelay);
		}

		// draw all projectiles (both players)
		DrawProjectiles();

		// player 1 update projectiles
		for (var i = 0; i < projectiles1.length; i++)
		{
			projectiles1[i].x += projectileSpeed;

			// check for projectile collision with borders
			if (projectiles1[i].x < 0 || projectiles1[i].y < 0 || projectiles1[i].x + projectileSize > canvas.width || projectiles1[i].y + projectileSize > canvas.height)
			{	// animate and then destroy projectile with splice

				// call fn projectileExplosion() for animation; maybe gif? neon?

				projectiles1.splice(i, 1);
			}
			else	//  check for projectile collision with players; only check if projectile still exists
			{
				// collision of projectiles1 with player 1
				if (projectiles1[i].x + projectileSize > square1X && projectiles1[i].x < square1X + squareSize && projectiles1[i].y + projectileSize > square1Y && projectiles1[i].y < square1Y + squareSize)
				{
					//alert("boom1");
					DamagePlayer1(projectileDamage);
					// animate projectile
					projectiles1.splice(i, 1);
				}
				else
				{
					// collision of projectiles1 with player 2 
					if (projectiles1[i].x + projectileSize > square2X && projectiles1[i].x < square2X + squareSize && projectiles1[i].y + projectileSize > square2Y && projectiles1[i].y < square2Y + squareSize)
					{
						//alert("boom2");
						DamagePlayer2(projectileDamage);
						// animate projectile
						projectiles1.splice(i, 1);
					}
				}
			}

			//console.log(projectiles1);
		}

		// player 2 update projectiles
		for (var i = 0; i < projectiles2.length; i++)
		{
			projectiles2[i].x -= projectileSpeed;

			// check for projectile collision with borders
			if (projectiles2[i].x < 0 || projectiles2[i].y < 0 || projectiles2[i].x + projectileSize > canvas.width || projectiles2[i].y + projectileSize > canvas.height)
			{	// animate and then destroy projectile with splice

				// call fn projectileExplosion() for animation

				projectiles2.splice(i, 1);
			}
			else	//  check for projectile collision with players; only check if projectile still exists
			{
				// collision of projectiles2 with player 1
				if (projectiles2[i].x + projectileSize > square1X && projectiles2[i].x < square1X + squareSize && projectiles2[i].y + projectileSize > square1Y && projectiles2[i].y < square1Y + squareSize)
				{
					//alert("boo0m1");
					DamagePlayer1(projectileDamage);
					// animate projectile
					projectiles2.splice(i, 1);
				}
				else
				{
					// collision of projectiles2 with player 2 
					if (projectiles2[i].x + projectileSize > square2X && projectiles2[i].x < square2X + squareSize && projectiles2[i].y + projectileSize > square2Y && projectiles2[i].y < square2Y + squareSize)
					{
						//alert("boom2");
						DamagePlayer2(projectileDamage);
						// animate projectile
						projectiles2.splice(i, 1);
					}
				}
			}

			//console.log(projectiles2);
		}
		// end drawing projectiles


		// debug text
		//DrawDebugText("X: " + square1X.toFixed(2) + "   Y: " + square1Y.toFixed(2));



		// check for endgame
		if (player1Health <= 0)
		{
			Pause();

			ctx.font = "50px Arial";
			ctx.fillStyle = "#eee";
			ctx.fillText("Player 2 wins!!!", canvas.width / 2 - 175, canvas.height / 2);


			endgame = true;
		}
		else if (player2Health <= 0)
		{
			Pause();

			ctx.font = "50px Arial";
			ctx.fillStyle = "#eee";
			ctx.fillText("Player 1 wins!!!", canvas.width / 2 - 175, canvas.height / 2);

			endgame = true;
		}
		else if (player1Health <= 0 && player2Health <= 0)
		{
			Pause();

			ctx.font = "50px Arial";
			ctx.fillStyle = "#eee";
			ctx.fillText("It's a tie !", canvas.width / 2 - 100, canvas.height / 2);

			endgame = true;
		}

		if (endgame == true)
		{
			ctx.font = "20px Arial";
			ctx.fillStyle = "#aaa";
			ctx.fillText("(Press 'Enter' to reload)", canvas.width / 2 - 110, canvas.height / 2 + 40);
		}
		if (restartKey == true)
		{
			location.reload();
		}


		//setInterval(draw, 10);
		requestAnimationFrame(Draw);
	}


};