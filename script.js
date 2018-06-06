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

		// update some variables; recalculate x and y
	}

	// classes ########################################################################################################
	class Player
	{
		constructor(x = 0, y = 0, color = "#f0f", keybindings = {})
		{
			this.x = x;										// x and y are middle of player hitbox
			this.y = y;
			this.color = color;
			this.health = 100;
			this.size = cw * 0.023;
			this.maxSpeed = cw * 0.005;						// default 0.004
			this.maxDiagonalSpeed = this.maxSpeed * 0.71;
			this.acceleration = cw * 0.0015;				// between 0 and maxSpeed
			this.decceleration = this.acceleration / 3;		// must be <= accelearation/2
			this.velX = 0;									// velocity, a vector, incudes direction AND speed
			this.velY = 0;
			this.clipSize = 5;
			this.clipAmmo = this.clipSize;
			this.canShoot = true;
			this.fireRateDelay = 500;						// fire rate delay in milliseconds; default 500
			this.fireMode = null;
			this.rechargeDelay = 5000;						// default 5000
			this.bullets = [];
			this.bulletOffsetFromPlayer = cw * 0.008;
			this.bulletSpeed = cw * 0.006;					// default 0.006

			this.keybindings =
			{
				// key: keybind code, state
				up: [keybindings.up, false],
				down: [keybindings.down, false],
				left: [keybindings.left, false],
				right: [keybindings.right, false],
				shoot: [keybindings.shoot, false]
			};

		}

		MoveCheck()
		{
			let isMoving = false;
			if (this.keybindings.up[1] || this.keybindings.down[1] || this.keybindings.left[1] || this.keybindings.right[1])
				isMoving = true;

			if (isMoving)
			{	// key presses change velocity
				if(this.keybindings.up[1])
				{
					this.velY -= this.acceleration;
				}
				if(this.keybindings.down[1])
				{
					this.velY += this.acceleration;
				}
				if(this.keybindings.left[1])
				{
					this.velX -= this.acceleration;
				}
				if(this.keybindings.right[1])
				{
					this.velX += this.acceleration;
				}
			}
			
			// slow down gradually
			this.velX -= this.decceleration * Math.sign(this.velX);
			this.velY -= this.decceleration * Math.sign(this.velY);

			// eliminate jumping around 0; fixed value of acceleration can't reduce it to 0
			if (Math.abs(this.velX) < this.decceleration)
				this.velX = 0;
			if (Math.abs(this.velY) < this.decceleration)
				this.velY = 0;
			
			// check for diagonal movement and reduce speed
			let maxVelocity = this.maxSpeed;
			if
			(
				(this.keybindings.up[1] && this.keybindings.left[1]) ||
				(this.keybindings.up[1] && this.keybindings.right[1]) ||
				(this.keybindings.down[1] && this.keybindings.left[1]) ||
				(this.keybindings.down[1] && this.keybindings.right[1])
			)
			{
				maxVelocity = this.maxDiagonalSpeed;
			}	

			// max velocity test
			if (this.velX < maxVelocity * (-1))
				this.velX = maxVelocity * (-1);
			if (this.velX > maxVelocity)
				this.velX = maxVelocity;
			if (this.velY < maxVelocity * (-1))
				this.velY = maxVelocity * (-1);
			if (this.velY > maxVelocity)
				this.velY = maxVelocity;
			
			// update coordinates
			this.x += this.velX;
			this.y += this.velY;

			// player with map walls collsion check
			let collisionResult = CollisionCheckInside(this.x, this.y, this.size, this.size, canvas.width / 2, canvas.height / 2, canvas.width, canvas.height);
			if (collisionResult.x != null)
			{
				this.x = collisionResult.x;
				this.y = collisionResult.y;
			}

			// collsion check with other players is defined as separate function(s)
		}

		SpawnBulletCheck()
		{
			if (this.keybindings.shoot[1] && this.clipAmmo > 0 && this.canShoot)
			{
				// disable shooting based on fire rate
				this.canShoot = false;
				setTimeout(function () { this.canShoot = true;}.bind(this), this.fireRateDelay);

				// spend bullet from clip
				this.clipAmmo--;
				if (this.clipAmmo < 0)
					this.clipAmmo = 0;
				
				// recharge clip based on recharge delay
				setTimeout(function ()
				{
					if (this.clipAmmo < this.clipSize)
						this.clipAmmo++;
				}.bind(this), this.rechargeDelay)

				// spawn bullet (add it to bullets array) based on fire mode
				switch (this.fireMode)
				{
					case "octa":
					{
						
						break;	
					}	
					default:
					{ // default firing style; quad fire
						// up
						this.bullets.push(new Bullet(this.x, this.y - this.size / 2 - this.bulletOffsetFromPlayer, 0, -this.bulletSpeed));
						// down	
						this.bullets.push(new Bullet(this.x, this.y + this.size / 2 + this.bulletOffsetFromPlayer, 0, this.bulletSpeed));
						// left
						this.bullets.push(new Bullet(this.x - this.size / 2 - this.bulletOffsetFromPlayer, this.y, -this.bulletSpeed, 0));
						// left
						this.bullets.push(new Bullet(this.x + this.size / 2 + this.bulletOffsetFromPlayer, this.y, this.bulletSpeed, 0));

						break;
					}	
				}

			}		

		}

	}

	class Bullet
	{ // default bullet
		constructor(x, y, xStep, yStep)
		{
			this.x = x;
			this.y = y;
			this.xStep = xStep;
			this.yStep = yStep;
			this.size = cw * 0.006;
			this.damage = 10;
		}
	}

	// main logic #####################################################################################################
	main();
	function main()
	{
		// initialize some variables
		Variables();

		// initialize players
		players = [];
		let keybindings =
		{
			up: 87,
			down: 83,
			left: 65,
			right: 68,
			shoot: 32
		}	
		let player = new Player(cw * 0.08, canvas.height / 2, "#0055cc", keybindings);
		players.push(player);
		keybindings =
		{
			up: 38,
			down: 40,
			left: 37,
			right: 39,
			shoot: 96
		}	
		player = new Player(cw - (cw * 0.08), canvas.height / 2, "#cc1100", keybindings);
		players.push(player);
		/*keybindings =
		{
			up: 73,
			down: 75,
			left: 74,
			right: 76
		}	
		player = new Player(cw / 2, canvas.height / 2, "#00ff22", keybindings);
		players.push(player);*/
		
		Update();		// main update fn which repeats itself every tick with requestAnimationFrame
	}

	// functions #####################################################################################################
	function Variables()	// initialize and update
	{
		// general
		cw = canvas.width;			// magic constant for converstion from pixels to multiples of canvas width is 0.0008; for cw * x, x = pixel_value * 0.0008
		numberOfPlayers = 2;
		endgame = false;
		restartKey = false;
	}

	function KeyDownHandler(e)
	{
		// general
		if (endgame == true && e.keyCode == 13)
		{
			restartKey = true;
		}

		// players keybindings
		for (let i = 0; i < numberOfPlayers; i++)
		{
			for (let keybinding of Object.values(players[i].keybindings))
			{
				if (e.keyCode == keybinding[0])
					keybinding[1] = true;
			}
		}
	}

	function KeyUpHandler(e)
	{
		// players keybindings
		for (let i = 0; i < numberOfPlayers; i++)
		{
			for (let keybinding of Object.values(players[i].keybindings))
			{
				if (e.keyCode == keybinding[0])
					keybinding[1] = false;
			}
		}

	}
	
	function CollisionCheckPlayers()
	{ // player with player collision check
		let collisions = [];	// array that holds all collisions as objects with information on who collided with who and where
		
		for (let i = 0; i < players.length; i++)
		{ // check every player ...
			for (let j = 0; j < players.length; j++)
			{ // ... with every other player ...
				if (j == i)
				{ // ... don't check a player with itself
					continue;
				}	
				else
				{ // detect collisions and push objects
					let collisionResult = CollisionCheckOutside(players[i].x, players[i].y, players[i].size, players[i].size, players[j].x, players[j].y, players[j].size, players[j].size);
					if (collisionResult.x != null)
					{
						let collisionResult2 = CollisionCheckOutside(players[j].x, players[j].y, players[j].size, players[j].size, players[i].x, players[i].y, players[i].size, players[i].size);
						collisions.push({ cResult1: collisionResult, cResult2: collisionResult2, player1: i, player2: j });
					}
				}
			}
		}

		for (let c of collisions)
		{ // set coords and velocities of players involved in collisions so they don't collide
			players[c.player1].x = c.cResult1.x;
			players[c.player1].y = c.cResult1.y;
			players[c.player2].x = c.cResult2.x;
			players[c.player2].y = c.cResult2.y;

			players[c.player1].velX = 0;
			players[c.player1].velY = 0;
			players[c.player2].velX = 0;
			players[c.player2].velY = 0;
			
		}
	}

	function CollisionCheckInside(x1, y1, w1, h1, x2, y2, w2, h2)
	{ // check if box1 is inside of box2; don't allow going outside of box2 by returning new x and y position that is in bounds
	  // coordinates assume center of boxes
		
		let newX = null;
		let newY = null;

		if (y1 - h1 / 2 < y2 - h2 / 2)
		{ // up
			newX = x1;
			newY = y2 - h2 / 2 + h1 / 2;
		}
		if (y1 + h1 / 2 > y2 + h2 / 2)
		{ // down
			newX = x1;
			newY = y2 + h2 / 2 - h1 / 2;
		}
		if (x1 - w1 / 2 < x2 - w2 / 2)
		{ // left
			newX = x2 - w2 / 2 + w1 / 2;
			newY = y1;
		}
		if (x1 + w1 / 2 > x2 + w2 / 2)
		{ // right
			newX = x2 + w2 / 2 - w1 / 2;
			newY = y1;
		}

		return ({ x: newX, y: newY });
	}

	function CollisionCheckOutside(x1, y1, w1, h1, x2, y2, w2, h2)	// fn returns point of collision (sort of)
	{ // check if box1 is outside of box2; don't allow clipping through box2; coordinates assume center of boxes
		let newX = null;
		let newY = null;
		let edgeDiff;	// for detecting on which edge collision happened > it will be the edge that has lowest edgeDiff value
		let d_up = Math.abs(Math.abs(y1 - h1 / 2) - Math.abs(y2 + h2 / 2));	 // space between box1 top and box2 bottom
		let d_down = Math.abs(Math.abs(y1 + h1 / 2) - Math.abs(y2 - h2 / 2));	// etc.
		let d_left = Math.abs(Math.abs(x1 - w1 / 2) - Math.abs(x2 + w2 / 2));
		let d_right = Math.abs(Math.abs(x1 + w1 / 2) - Math.abs(x2 - w2 / 2));

		if ((y1 - h1 / 2 < y2 + h2 / 2))
		{ // up
			edgeDiff = d_up;
			newX = x1;
			newY = y2 + h2 / 2 + h1 / 2;
		}
		if ((y1 + h1 / 2 > y2 - h2 / 2))
		{ // down
			if (d_down < edgeDiff)
			{
				edgeDiff = d_down;
				newX = x1;
				newY = y2 - h2 / 2 - h1 / 2;
			}			
		}
		if ((x1 - w1 / 2 < x2 + w2 / 2))
		{ // left
			if (d_left < edgeDiff)
			{
				edgeDiff = d_left;
				newX = x2 + w2 / 2 + w1 / 2;
				newY = y1;
			}
		}
		if ((x1 + w1 / 2 > x2 - w2 / 2))
		{ // right
			if (d_right < edgeDiff)
			{
				edgeDiff = d_right;
				newX = x2 - w2 / 2 - w1 / 2;
				newY = y1;
			}
		}

		if (!((y1 - h1 / 2 < y2 + h2 / 2) && (y1 + h1 / 2 > y2 - h2 / 2) && (x1 - w1 / 2 < x2 + w2 / 2) && (x1 + w1 / 2 > x2 - w2 / 2)))
		{ // all; no collision
			newX = null;
			newY = null;
		}
		
		return ({ x: newX, y: newY });
	}

	function DrawDebugText(text)
	{
		ctx.font = "20px Arial";
		ctx.fillStyle = "#eee";
		ctx.fillText(text, 10, 20);
	}

	function DrawPlayers()
	{
		for (let i = 0; i < numberOfPlayers; i++)
		{
			// player body
			ctx.beginPath();
			ctx.rect(players[i].x - players[i].size / 2, players[i].y - players[i].size / 2, players[i].size, players[i].size);
			ctx.fillStyle = players[i].color;
			ctx.fill();
			ctx.closePath();

			// player health as text
			ctx.font = "12px Arial";
			ctx.fillStyle = "#eee";
			ctx.fillText(players[i].health, players[i].x - 10, players[i].y - players[i].size / 2 - cw * 0.012);

			// player health bar
			let barWidth = players[i].size * 1.3;
			let barHeight = cw * 0.001;
			ctx.beginPath();		// health bar background
			ctx.rect(players[i].x - barWidth / 2, players[i].y - players[i].size / 2 - cw * 0.01, barWidth, barHeight);
			ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
			ctx.fill();
			ctx.closePath();
			ctx.beginPath();		// health bar foreground
			ctx.rect(players[i].x - barWidth / 2, players[i].y - players[i].size / 2 - cw * 0.01, barWidth * players[i].health / 100, barHeight);
			ctx.fillStyle = "#00ff33";
			ctx.fill();
			ctx.closePath();
		}
	}

	function DrawBullets()
	{
		for (let i = 0; i < numberOfPlayers; i++)
		{
			for (let bullet of players[i].bullets)
			{
				ctx.beginPath();
				ctx.rect(bullet.x - bullet.size / 2, bullet.y - bullet.size / 2, bullet.size, bullet.size);
				ctx.fillStyle = "#eee";
				ctx.fill();
				ctx.closePath();
			}
		}	
	}

	function UpdateBullets()
	{
		for (let i = 0; i < numberOfPlayers; i++)
		{
			for (let j = 0; j < players[i].bullets.length; j++)
			{
				let bullet = players[i].bullets[j];		// use only for read
				
				// update bullet position
				players[i].bullets[j].x += players[i].bullets[j].xStep;
				players[i].bullets[j].y += players[i].bullets[j].yStep;
				
				// check for collision, draw bullet last time and delete that bullet from array
				let collisionResult = CollisionCheckInside(bullet.x, bullet.y, bullet.size, bullet.size, canvas.width / 2, canvas.height / 2, canvas.width, canvas.height);
				if (collisionResult.x != null)
				{
					players[i].bullets[j].x = collisionResult.x;
					players[i].bullets[j].y = collisionResult.y;

					players[i].bullets.splice(j, 1);
				}	

			}	
		}
	}

	function DamagePlayer1(damage)	// depricated
	{
		player1Health -= damage;
	}

	function DamagePlayer2(damage)	// depricated
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

	function Update()
	{
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		for (let i = 0; i < numberOfPlayers; i++)
		{
			players[i].MoveCheck();			// check if player can move (detect key-press; control player speed; wall collision)
			players[i].SpawnBulletCheck();	// check if bullet can spawn (detect key-press; clip size and fire rate control)
		}

		CollisionCheckPlayers();			// player with player collisions
		DrawPlayers();						// what do you think this does?

		UpdateBullets();					// update bullet position; check for collisions
		DrawBullets();
		




		/*
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
		*/

		//setInterval(draw, 10);
		requestAnimationFrame(Update);
	}


};