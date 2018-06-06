window.onload = function ()
{
	// canvas initialization
	var canvas = document.getElementById("myCanvas");
	var ctx = canvas.getContext("2d");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	// event listeners
	document.addEventListener("keydown", KeyDownHandler, false);
	document.addEventListener("keyup", KeyUpHandler, false);
	canvas.addEventListener("mousemove", MouseMoveHandler, false);
	canvas.addEventListener("mouseup", MouseUpHandler, false);

	// resizing
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
		constructor(name, x = 0, y = 0, color = "#f0f", keybindings = {})
		{
			this.name = name;
			this.x = x;										// x and y are middle of player hitbox
			this.y = y;
			this.color = color;
			this.health = 100;
			this.size = cw * 0.023;
			this.maxSpeed = cw * 0.005;						// default 0.004 or 0.005
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
			this.initialRechargeDelay = 2000;				// default 5000
			this.rechargeDelay = 500;
			this.ammoRechargeDate = null;
			this.bullets = [];
			this.bulletOffsetFromPlayer = cw * 0.008;
			this.bulletSpeed = cw * 0.008;					// default 0.006
			this.score = 0;

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
			let collisionResult = CollisionCheckInside(this.x, this.y, this.size + cw * 0.003, this.size + cw * 0.003, canvas.width / 2, (canvas.height - scoresHeight) / 2, canvas.width, canvas.height - scoresHeight);
			if (collisionResult.x != null)
			{
				this.x = collisionResult.x;
				this.y = collisionResult.y;
			}

			// collsion check with other players is defined as separate function(s)
		}

		SpawnBulletCheck()
		{
			// TODO: dont spawn if too close to a player; damage?
			if (this.keybindings.shoot[1] && this.clipAmmo > 0 && this.canShoot)
			{
				// disable shooting based on fire rate
				this.canShoot = false;
				setTimeout(function () { this.canShoot = true;}.bind(this), this.fireRateDelay);

				// spend bullet from clip
				this.clipAmmo--;
				if (this.clipAmmo < 0)
					this.clipAmmo = 0;
				
				// set time to start ammo recharge
				this.ammoRechargeDate = new Date().getTime() + this.initialRechargeDelay;

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
						// right
						this.bullets.push(new Bullet(this.x + this.size / 2 + this.bulletOffsetFromPlayer, this.y, this.bulletSpeed, 0));

						break;
					}	
				}

				// delete bullets that spawned outside of bounds
				let toSplice = [];
				for (let i = 0; i < this.bullets.length; i++)
				{
					let b = this.bullets[i];
					let collisionResult = CollisionCheckInside(b.x, b.y, b.size, b.size, canvas.width / 2, canvas.height / 2, canvas.width, canvas.height);
					if (collisionResult.x != null)
					{
						this.bullets.splice(i, 1);
						i--;
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
			this.size = cw * 0.004;
			this.damage = 10;
		}
	}

	// main logic #####################################################################################################
	main();
	function main()
	{
		// initialize some global variables
		Variables();

		// TODO: loader?
		LoadAssets();

		// start with 2 players
		AddNewPlayer();
		AddNewPlayer();
		
		
		
		MenuUpdate();	// draw main menu; main menu will later call update
		//Update();		// main update fn which repeats itself every tick with requestAnimationFrame
	
		
	}

	// functions #####################################################################################################
	function Variables()	// initialize global variables
	{
		// general
		cw = canvas.width;			// magic constant for converstion from pixels to multiples of canvas width is 0.0008; for cw * x, x = pixel_value * 0.0008
		ch = canvas.height;
		endgame = false;
		restartKey = false;
		gameState = "menu";
		players = [];
		maxNumberOfPlayers = 6;					// maximum number of players
		assets = { images: {}, sounds: [] };
		mouseX = null;							// mouse x position
		mouseY = null;							// mouse y position
		mouseUpX = null;						// x position where last click was detected
		mouseUpY = null;						// y position where last click was detected
		scoresHeight = cw * 0.03;				// width of score panel; global because players should colide with it

		// main menu
		playerCustomizationIndex = null;		// index of player who is beeing customized in customization dialog; if !null dialog exists
		editingNameIndex = null;				// index of player whose name is beeing edited; if !null editing is in progress and cursor is drawn
		editingKeybindIndex = null;				// index of player whose keybindings are beeing edited; if !null editing is in progress
		keybindAction = "";						// up, down, left, right or shoot
		upperCase = false;						// is shift pressed?

		// color palette
		colorPalette = 
		[
			["#C00300", "#C04000", "#9A6600", "#9A9A00", "#6FA600"],
			["#0040C0", "#0080C0", "#00A66F", "#00A637", "#00C000"],
			["#0000C0", "#4000C0", "#A000C0", "#C00060", "#606060"]
		]

		// player defaults (name, color, keybindings)
		// TODO: change some controls as shift + Num0 dont work at the same time
		playerCustDefaults = [];
		playerCustDefaults[0] = { name: "Player 1", color: colorPalette[1][0], keybindings:
			{
				up: 87,
				down: 83,
				left: 65,
				right: 68,
				shoot: 32
			}
		};
		playerCustDefaults[1] = { name: "Player 2", color: colorPalette[0][0], keybindings:
			{
				up: 38,
				down: 40,
				left: 37,
				right: 39,
				shoot: 110
			}
		};
		playerCustDefaults[2] = { name: "Player 3", color: colorPalette[1][4], keybindings:
			{
				up: 73,
				down: 75,
				left: 74,
				right: 76,
				shoot: 66
			}	
		};
		playerCustDefaults[3] = { name: "Player 4", color: colorPalette[0][3], keybindings:
			{
				up: 104,
				down: 101,
				left: 100,
				right: 102,
				shoot: 107
			}	
		};
		playerCustDefaults[4] = { name: "Player 5", color: colorPalette[2][1], keybindings:
			{
				up: 84,
				down: 71,
				left: 70,
				right: 72,
				shoot: 88
			}	
		};
		playerCustDefaults[5] = { name: "Player 6", color: colorPalette[0][1], keybindings:
			{
				up: 36,
				down: 35,
				left: 46,
				right: 34,
				shoot: 8
			}	
		};

		// player defaults (coordinates)
		// player default coordinates are different for games with different number of players
		// playerCoordDefaults[m][n]; m = number of players in game, n = nth player of total m players
		playerCoordDefaults = 
		[
			// 1 player game (unused)
			[{x: cw*0.5, y: ch*0.5}],

			// 2 player game
			[{x: cw*0.15, y: ch*0.5}, {x: cw*0.85, y: ch*0.5}],

			// 3 player game
			[{x: cw*0.15, y: ch*0.8}, {x: cw*0.85, y: ch*0.8}, {x: cw*0.5, y: ch*0.2}],
			
			// 4 player game
			[{x: cw*0.15, y: ch*0.2}, {x: cw*0.85 , y: ch*0.2}, {x: cw*0.15, y: ch*0.8}, {x: cw*0.85 , y: ch*0.8}],
			
			// 5 player game
			[{ x: cw * 0.15, y: ch * 0.2 },
			{ x: cw * 0.85, y: ch * 0.2 },
			{ x: cw * 0.15, y: ch * 0.8 },
			{ x: cw * 0.85, y: ch * 0.8 },
			{ x: cw *0.5, y: ch *0.5 }],
			
			// 6 player game
			[{ x: cw * 0.15, y: ch * 0.2 },
			{ x: cw * 0.5, y: ch * 0.2 },
			{ x: cw * 0.85, y: ch * 0.2 },
			{ x: cw * 0.15, y: ch * 0.8 },
			{ x: cw * 0.5, y: ch * 0.8 },
			{ x: cw * 0.85, y: ch * 0.8 }],

		]// end playerCoordDefaults
	}

	// TODO: disable start if no players or 1 player
	// TODO: exclamation point for unbound keys
	// TODO: text in FF; keyCode depricated?; test all in other  browsers	
	function KeyDownHandler(e)
	{
		// general
		/*if (endgame == true && e.keyCode == 13)
		{
			restartKey = true;
		}*/

		// players keybindings (detect keypress during game)
		for (let i = 0; i < players.length; i++)
		{
			for (let keybinding of Object.values(players[i].keybindings))
			{
				if (e.keyCode == keybinding[0])
					keybinding[1] = true;
			}
		}

		// customization dialog
		if (playerCustomizationIndex != null && editingNameIndex == null && editingKeybindIndex == null)
		{
			// esc or enter
			if (e.keyCode == 27 || e.keyCode == 13)
				playerCustomizationIndex = null;
		}
		
		// name edit
		let maxNameLength = 10;
		if (editingNameIndex != null)
		{
			if (players[editingNameIndex].name.length < maxNameLength)
			{
				// only letters and numbers...
				for (let i = 48; i <= 90; i++)
				{
					if (i == e.keyCode)
					{
						if (upperCase)
							players[editingNameIndex].name += String.fromCharCode(e.keyCode);
						else
							players[editingNameIndex].name += String.fromCharCode(e.keyCode).toLocaleLowerCase();
					}	
				}
				
				// ...and space
				if (e.keyCode == 32)
					players[editingNameIndex].name += String.fromCharCode(e.keyCode);
			}	
			
			// backspace
			if (e.keyCode == 8)
				players[editingNameIndex].name = players[editingNameIndex].name.slice(0, -1);
			
			// esc or enter
			if (e.keyCode == 27 || e.keyCode == 13)
				editingNameIndex = null;
		}

		// edting keybindings
		if (editingKeybindIndex != null)
		{
			if (e.keyCode != 27 && e.keyCode != 13)
			{
				players[editingKeybindIndex].keybindings[keybindAction][0] = e.keyCode;
				editingKeybindIndex = null;
			}

			// esc or enter
			if (e.keyCode == 27 || e.keyCode == 13)
				editingKeybindIndex = null;
		}	

		

		// upper case; is shift pressed?
		if (e.keyCode == 16)
			upperCase = true;
	}
	
	function KeyUpHandler(e)
	{
		// players keybindings
		for (let i = 0; i < players.length; i++)
		{
			for (let keybinding of Object.values(players[i].keybindings))
			{
				if (e.keyCode == keybinding[0])
					keybinding[1] = false;
			}
		}

		// upper case; is shift?
		if (e.keyCode == 16)
			upperCase = false;
	}

	function MouseMoveHandler(e)
	{
		//console.log(e.x + " " + e.y);
		mouseX = e.x;
		mouseY = e.y;
	}

	function MouseUpHandler(e)
	{
		//console.log(e.x + " " + e.y + "  UP");
		mouseUpX = e.x;
		mouseUpY = e.y;
		editingNameIndex = null;
		editingKeybindIndex = null;
	}

	function LoadAssets()
	{
		let images = 
		{
			ico_editNameNormal: "images/ico_editNameNormal.png",
			ico_editNameHover: "images/ico_editNameHover.png",
			ico_editColorNormal: "images/ico_editColorNormal.png",
			ico_editColorHover: "images/ico_editColorHover.png",
			ico_customizationNormal: "images/ico_customizationNormal.png",
			ico_customizationHover: "images/ico_customizationHover.png",
			ico_PlusNormal: "images/ico_PlusNormal.png",
			ico_PlusHover: "images/ico_PlusHover.png",
			ico_xNormal: "images/ico_xNormal.png",
			ico_xHover: "images/ico_xHover.png"

		}
		
		for (let i in images)
		{
			let src = images[i];
			images[i] = new Image();
			images[i].src = src;
		}
		assets.images = images;
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
					let collisionResult = CollisionCheckOutside(players[i].x, players[i].y, players[i].size + cw*0.003, players[i].size + cw*0.003, players[j].x, players[j].y, players[j].size, players[j].size);
					if (collisionResult.x != null)
					{
						let collisionResult2 = CollisionCheckOutside(players[j].x, players[j].y, players[j].size + cw*0.003, players[j].size + cw*0.003, players[i].x, players[i].y, players[i].size, players[i].size);
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
			//newX = x1;
			newY = y2 - h2 / 2 + h1 / 2;
		}
		if (y1 + h1 / 2 > y2 + h2 / 2)
		{ // down
			//newX = x1;
			newY = y2 + h2 / 2 - h1 / 2;
		}
		if (x1 - w1 / 2 < x2 - w2 / 2)
		{ // left
			newX = x2 - w2 / 2 + w1 / 2;
			//newY = y1;
		}
		if (x1 + w1 / 2 > x2 + w2 / 2)
		{ // right
			newX = x2 + w2 / 2 - w1 / 2;
			//newY = y1;
		}

		// fix for diagonal movement in corners of map
		if (newX != null || newY != null)
		{
			if (newX == null)
				newX = x1;
			if (newY == null)
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
		ctx.font = "300 20px Open sans";
		ctx.fillStyle = "#eee";
		ctx.fillText(text, 10, 20);
	}

	function DrawPlayers()
	{
		for (let i = 0; i < players.length; i++)
		{
			if (players[i].health <= 0)			// skip if player has no more health
				continue;
			
			// player body
			DrawNeonRect(players[i].x - players[i].size / 2, players[i].y - players[i].size / 2, players[i].size, players[i].size, players[i].color);
		}

		for (let i = 0; i < players.length; i++)
		{ // this is separate from player body, so that health is always drawn on top
			if (players[i].health <= 0)			// skip if player has no more health
				continue;
			
			// player health as text
			/*ctx.font = "12px Arial";
			ctx.fillStyle = "#eee";
			ctx.fillText(players[i].health, players[i].x - 10, players[i].y - players[i].size / 2 - cw * 0.012);*/

			// TODO: draw player name?

			// player health bar
			let barWidth = players[i].size * 1.3;
			let barHeight = cw * 0.001;
			ctx.beginPath();		// health bar background
			ctx.rect(players[i].x - barWidth / 2, players[i].y - players[i].size / 2 - cw * 0.007, barWidth, barHeight);
			ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
			ctx.fill();
			ctx.closePath();
			ctx.beginPath();		// health bar foreground
			ctx.rect(players[i].x - barWidth / 2, players[i].y - players[i].size / 2 - cw * 0.007, barWidth * players[i].health / 100, barHeight);
			ctx.fillStyle = "#00ff33";
			ctx.shadowColor = "#008811";
			ctx.shadowBlur = 5;
			ctx.fill();
			ctx.closePath();
			ctx.shadowBlur = 0;

			// ammo clip
			let ammoBoxSize = cw * 0.0032;
			let ammoBoxSpacing = cw * 0.002;
			let ammoTotalWidth = players[i].clipSize * ammoBoxSize + (players[i].clipSize - 1) * ammoBoxSpacing;
			let firstBoxX = players[i].x - ammoTotalWidth / 2; // firstBoxX is not in center of the box, but in upper-left corner
			let boxY = players[i].y + players[i].size / 2 + cw * 0.007;
			for (let j = 0; j < players[i].clipSize; j++)
			{
				if ((j+1) <= players[i].clipAmmo)
				{ // ammo clip foreground
					ctx.beginPath();
					ctx.rect(firstBoxX + j * (ammoBoxSize + ammoBoxSpacing), boxY, ammoBoxSize, ammoBoxSize);
					ctx.fillStyle = "#ddd";
					ctx.shadowColor = "#ccc";
					ctx.shadowBlur = 3;
					ctx.fill();
					ctx.closePath();
					ctx.shadowBlur = 0;
				}
				else
				{ // ammo clip background
					ctx.beginPath();
					ctx.rect(firstBoxX + j * (ammoBoxSize + ammoBoxSpacing), boxY, ammoBoxSize, ammoBoxSize);
					ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
					ctx.fill();
					ctx.closePath();
				}	
				
			}

		}
	}

	function DrawRectangle(x, y, w, h, cornerCurve, fill = false)
	{
		ctx.beginPath();
		ctx.moveTo(x + cornerCurve, y);
		ctx.lineTo(x + w - cornerCurve, y);
		ctx.quadraticCurveTo(x + w - cornerCurve, y, x + w, y + cornerCurve);
		ctx.lineTo(x + w, y + h - cornerCurve);
		ctx.quadraticCurveTo(x + w, y + h - cornerCurve, x + w - cornerCurve, y + h);
		ctx.lineTo(x + cornerCurve, y + h);
		ctx.quadraticCurveTo(x + cornerCurve, y + h, x, y + h - cornerCurve);
		ctx.lineTo(x, y + cornerCurve);
		ctx.quadraticCurveTo(x, y + cornerCurve, x + cornerCurve, y);
		ctx.closePath();
		ctx.stroke();

		if (fill)
			ctx.fill();	
	}
	
	function DrawNeonRect(x, y, w, h, color)
	{
		ctx.globalCompositeOperation = "lighter";

		let r = hexToRgb(color).r;
		let g = hexToRgb(color).g;
		let b = hexToRgb(color).b;
		ctx.shadowColor = color;
		ctx.shadowBlur = 10;
		ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + ",0.2)";
		ctx.lineWidth=7.5;
		DrawRectangle(x, y, w, h, 1);
		ctx.lineWidth=6;
		DrawRectangle(x, y, w, h, 1);
		ctx.lineWidth=4.5;
		DrawRectangle(x, y, w, h, 1);
		ctx.lineWidth=3;
		DrawRectangle(x, y, w, h, 1);
		ctx.strokeStyle = "#fff";
		ctx.lineWidth=1.5;
		DrawRectangle(x, y, w, h, 1);
		
		ctx.globalCompositeOperation = "source-over";
		ctx.shadowBlur = 0;
	};

	function componentToHex(c)
	{
		var hex = c.toString(16);
		return hex.length == 1 ? "0" + hex : hex;
	}
	
	function rgbToHex(r, g, b)
	{
		return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
	}

	function hexToRgb(hex)
	{
		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, function(m, r, g, b) {
			return r + r + g + g + b + b;
		});
	
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	}

	function DrawBullets()
	{
		// TODO: try debug bullet flicker

		for (let i = 0; i < players.length; i++)
		{
			for (let bullet of players[i].bullets)
			{
				ctx.beginPath();
				ctx.rect(bullet.x - bullet.size / 2, bullet.y - bullet.size / 2, bullet.size, bullet.size);
				ctx.fillStyle = "#eee";
				ctx.shadowColor = "#fff";
				ctx.shadowBlur = 7;
				ctx.fill();
				ctx.closePath();
				ctx.shadowBlur = 0;
			}
		}	
	}

	function UpdateBullets()
	{
		for (let i = 0; i < players.length; i++)
		{ // i is index of player who fired bullet
			for (let j = 0; j < players[i].bullets.length; j++)
			{ // j is index of bullet in question
				let b = players[i].bullets[j];		// use only for read
				
				// update bullet position
				players[i].bullets[j].x += players[i].bullets[j].xStep;
				players[i].bullets[j].y += players[i].bullets[j].yStep;
				
				// check for collision with wall, draw bullet last time and delete that bullet from array
				let collisionResult = CollisionCheckInside(b.x, b.y, b.size, b.size, canvas.width / 2, canvas.height / 2, canvas.width, canvas.height);
				if (collisionResult.x != null)
				{
					players[i].bullets[j].x = collisionResult.x;
					players[i].bullets[j].y = collisionResult.y;
					DrawBullets();

					players[i].bullets.splice(j, 1);
					j--;
				}
			}	
			// TODO?: BUG: red player shooting just under blue on any edge of screen; if red is above upper bullet disappears

			// check for collision with players for the remaining bullets
			for (let j = 0; j < players[i].bullets.length; j++)
			{ // j is index of bullet in question
				let b = players[i].bullets[j];		// use only for read

				for (let k = 0; k < players.length; k++)
				{ // k is index of player who caught the bullet
					collisionResult = CollisionCheckOutside(b.x, b.y, b.size, b.size, players[k].x, players[k].y, players[k].size, players[k].size);
					if (collisionResult.x != null)
					{
						DamagePlayer(k, b.damage);

						players[i].bullets[j].x = collisionResult.x;
						players[i].bullets[j].y = collisionResult.y;
						DrawBullets();

						players[i].bullets.splice(j, 1);
						j--;
					}
				}
			}
			
			
		}
	}

	function DamagePlayer(playerIndex, damage)
	{
		players[playerIndex].health -= damage;
		if (players[playerIndex].health < 0)
			players[playerIndex].health = 0;
	}

	function PauseGame()
	{
		// TODO: allow pause during midgame and resuming or going to menu

		for (let i = 0; i < players.length; i++)
		{
			players[i].maxSpeed = 0;
			players[i].maxDiagonalSpeed = 0;
			players[i].canShoot = false;

			// freeze all bullets
			for (let j = 0; j < players[i].bullets.length; j++)
			{
				players[i].bullets[j].xStep = 0;
				players[i].bullets[j].yStep = 0;
			}
		}
	}

	function FreezeGame()
	{
		for (let i = 0; i < players.length; i++)
		{
			players[i].maxSpeed = 0;
			players[i].maxDiagonalSpeed = 0;
			players[i].canShoot = false;

			// freeze all bullets
			for (let j = 0; j < players[i].bullets.length; j++)
			{
				players[i].bullets[j].xStep = 0;
				players[i].bullets[j].yStep = 0;
			}
		}
	}

	function UnpauseGame()
	{
		// TODO ...
		// if game is paused and not endgame

	}

	// TODO: new game countdown

	function RestartGame()
	{		
		let newPlayers = [];

		for (let i = 0; i < players.length; i++)
		{
			// persist
			let name = players[i].name;
			let color = players[i].color;
			let keybindings = players[i].keybindings;
			let score = players[i].score;
			
			let player = new Player(name, 0, 0, color, keybindings);
			player.keybindings = keybindings;
			player.score = score;

			newPlayers.push(player);
		}

		players = newPlayers;

		// update(reset) x and y of all players
		for (let i = 0; i < players.length; i++)
		{ // playerCoordDefaults[m][n]; m = number of players in game, n = nth player of total m players
			players[i].x = playerCoordDefaults[players.length-1][i].x;
			players[i].y = playerCoordDefaults[players.length-1][i].y;
		}

		endgame = false;
	}

	function endGameCheck()
	{
		// TODO: announce win (no dialog? animate?) and continue after x seconds; increment player score counter

		let alivePlayers = 0;
		let alivePlayerIndex;
		for (let i = 0; i < players.length; i++)
		{
			if (players[i].health > 0)
			{
				alivePlayers++;
				alivePlayerIndex = i;
			}
		}
		
		if (alivePlayers <= 1)	// 1
		{ // endgame

			if (alivePlayers == 1)	// 1
			{ // 1 winner
				players[alivePlayerIndex].score++;	
			}

			endgame = true;
			FreezeGame();
			setTimeout(RestartGame, 3000);

			// announce
			/*
			// background box
			let boxW = cw * 0.4;
			let boxH = cw * 0.2;
			ctx.beginPath();
			ctx.rect(canvas.width / 2 - boxW / 2, canvas.height / 2 - boxH / 2, boxW, boxH);
			ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
			ctx.fill();
			ctx.closePath();

			let fontSizeWinner = cw * 0.035;
			let fontSizeRestart = cw * 0.014;

			if (alivePlayers == 1)	// 1
			{ // 1 winner
				// TODO: change all to open sans (if it is used)
				ctx.font = fontSizeWinner + "px Arial";
				ctx.fillStyle = "#eee";
				ctx.textAlign = "center";
				ctx.fillText(players[alivePlayerIndex].name + " wins!", canvas.width / 2, canvas.height / 2);
			}
			if (alivePlayers == 0)	// 0
			{ // no winners
				ctx.font = fontSizeWinner + "px Arial";
				ctx.fillStyle = "#eee";
				ctx.textAlign = "center";
				ctx.fillText("Good job, nobody wins!", canvas.width / 2, canvas.height / 2);
			}

			ctx.font = fontSizeRestart + "px Arial";
			ctx.fillStyle = "#aaa";
			ctx.textAlign = "center";
			ctx.fillText("Press [Enter] to restart", canvas.width / 2, canvas.height / 2 + 40);

			if (restartKey == true)
			{
				location.reload();
			}*/
			// end announce
		}	

	}

	function DrawScores()
	{
		// background tint
		ctx.beginPath();
		ctx.rect(0, ch - scoresHeight, cw, scoresHeight);
		ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
		ctx.fill();
		ctx.closePath();

		// text
		for (let i = 0; i < players.length; i++)
		{
			let x = cw / (players.length + 1) * (i+1);
			let y = ch - cw * 0.01;
			let text = players[i].name + ": " + players[i].score;
			let font = "300 " + cw * 0.015 + "px Open sans";
			ctx.textAlign = "center";
			DrawNeonText(text, x, y, font, players[i].color, 10);
		}
	}

	function Update()
	{
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		for (let i = 0; i < players.length; i++)
		{
			players[i].MoveCheck();			// check if player can move (detect key-press; control player speed; wall collision)
			players[i].SpawnBulletCheck();	// check if bullet can spawn (detect key-press; clip size and fire rate control)

			// recharge bullets
		if (players[i].clipAmmo < players[i].clipSize && new Date().getTime() >= players[i].ammoRechargeDate && !endgame)
			{
				players[i].clipAmmo++;
				players[i].ammoRechargeDate = new Date().getTime() + players[i].rechargeDelay;
			}	
		}

		CollisionCheckPlayers();			// player with player collisions
		DrawPlayers();						// what do you think this does?

		UpdateBullets();					// update bullet position; check for collisions; damage players
		DrawBullets();

		//console.log(players[0].bullets.length);

		if (!endgame)
			endGameCheck();

		DrawScores();

		//setInterval(Update, 1000);
		requestAnimationFrame(Update);
	}


	// Main menu functions ##################################################################################################
	function DrawButton(x, y, w, h, iconNormal, iconHover, color = "#aaa")
	{
		if (PointIsInside(mouseX, mouseY, x, y, w, h))
		{ // mouse hover
			ctx.shadowColor = color;
			ctx.shadowBlur = 10;
			ctx.drawImage(iconHover, x, y, w, h);
			ctx.shadowBlur = 0;
		}
		else
		{ // normal mode
			ctx.shadowColor = color;
			ctx.shadowBlur = 10;
			ctx.drawImage(iconNormal, x, y, w, h);
			ctx.shadowBlur = 0;
		}

		let clicked = false;
		if (PointIsInside(mouseUpX, mouseUpY, x, y, w, h))
		{ // detect mouse click
			clicked = true;
		}

		return clicked;
	}

	function PointIsInside(a, b, x, y, w, h)
	{ // is point with coordinates a,b inside of box; box x,y are its upper-left coordinates
		if
		(
			(a > x && a < x + w) &&
			(b > y && b < y + h)
		)
			return true;
		else
			return false;
	}

	function DrawNeonText(text, x, y, font, color, shadowBlur = 20)
	{
		ctx.font = font;
		ctx.shadowColor = color;
		ctx.shadowBlur = shadowBlur;
		ctx.shadowOffsetX = x + 10000;
		ctx.fillStyle ="#fff";
		ctx.fillText(text, -10000, y);
		ctx.fillText(text, -10000, y);
		ctx.fillText(text, -10000, y);
		ctx.shadowOffsetX = 0;
		ctx.fillText(text, x, y);
		ctx.shadowBlur = 0;
	}

	function AddNewPlayer()
	{
		// read from defaults based on currnet players.length and add player
		let name = playerCustDefaults[players.length].name;
		let color = playerCustDefaults[players.length].color;
		let keybindings = playerCustDefaults[players.length].keybindings;
 		let player = new Player(name, 0, 0, color, keybindings);
		players.push(player);

		// update x and y of all players
		for (let i = 0; i < players.length; i++)
		{ // playerCoordDefaults[m][n]; m = number of players in game, n = nth player of total m players
			players[i].x = playerCoordDefaults[players.length-1][i].x;
			players[i].y = playerCoordDefaults[players.length-1][i].y;
		}
		
	}

	function DrawPlayerNamesAndButtons()
	{
		let fontSizePlayer = cw * 0.024;		// old val 0.028
		let nameX = cw * 0.12;
		let nameYoffset = cw * 0.2;				// also: Y position of first name
		let custButtonSize = cw * 0.02;
		let custButtonX = nameX + cw * 0.27;
		for (let i = 0; i < players.length; i++)
		{
			// name text
			let nameYspacing = i * fontSizePlayer * 1.5;
			let nameY = nameYoffset + nameYspacing;
			nameFont = "300 " + fontSizePlayer + "px Open sans";
			DrawNeonText(players[i].name, nameX, nameY, nameFont, players[i].color);
			
			// player customization button
			let custButtonY = nameYoffset + nameYspacing - fontSizePlayer * 0.35 - custButtonSize / 2;
			if (playerCustomizationIndex == null)
			{ // if there is no dialog menu draw button and detect click
				if (DrawButton(custButtonX, custButtonY, custButtonSize, custButtonSize, assets.images.ico_customizationNormal, assets.images.ico_customizationHover))
				{ // click detected
					mouseUpX = null;
					mouseUpX = null;
					playerCustomizationIndex = i;
					// logic of this click is in dialog menu (DrawCustomizationDialog)					
				}
			}
			else
			{ // if there is dialog, don't detect click and draw without highlight
				DrawButton(custButtonX, custButtonY, custButtonSize, custButtonSize, assets.images.ico_customizationNormal, assets.images.ico_customizationNormal);
			}

			// exclamation point for conflicts
			let conflictDetected = false;
			for (let keybinding of Object.entries(players[i].keybindings))
			{
				for (let j = 0; j < players.length; j++)
				{
					for (let key of Object.entries(players[j].keybindings))
					{
						if (!(j == i && keybinding[0] == key[0]))
						{ // skip self; check with all other keybindings
							if (keybinding[1][0] == key[1][0])
							{ // conflict detected
								conflictDetected = true;
							}
						}
					}
				}	
			}
			if (conflictDetected)
			{
				// draw exclamation
				let conflictFontSize = fontSizePlayer * 0.75;
				let conflictFont = "300 " + conflictFontSize + "px Open sans";
				let conflictTextX = custButtonX - cw * 0.01;
				let conflictTextY = custButtonY + custButtonSize/2 + conflictFontSize*0.35;
				DrawNeonText("!", conflictTextX, conflictTextY, conflictFont, "#a00", 15);
			}
			



			//  delete player button (should be drawn last in this loop)
			let deleteButtonSize = cw * 0.012;
			let deleteButtonX = nameX - cw * 0.03;
			let deleteButtonY = nameYoffset + nameYspacing - fontSizePlayer * 0.35 - deleteButtonSize / 2;
			if (playerCustomizationIndex == null)
			{ // if there is no dialog menu draw button and detect click
				if (DrawButton(deleteButtonX, deleteButtonY, deleteButtonSize, deleteButtonSize, assets.images.ico_xNormal, assets.images.ico_xHover, "#f00"))
				{ // click detected
					mouseUpX = null;
					mouseUpX = null;
					players.splice(i, 1);
					i--;
				}
			}
			else
			{ // if there is dialog, don't detect click and draw without highlight
				DrawButton(deleteButtonX, deleteButtonY, deleteButtonSize, deleteButtonSize, assets.images.ico_xNormal, assets.images.ico_xNormal, "#f00");
			}
			
		// end for loop through all players
		}


		// add player button as text
		let btnW = custButtonX - nameX;
		let btnH = cw*0.03;
		let btnX = nameX;
		let btnY =  nameYoffset - cw * 0.065;
		if (playerCustomizationIndex == null)
		{ // if there is no dialog menu draw button and detect click
			if (DrawTextButton(btnX, btnY, btnW, btnH, "Add new player"))
			{ // click detected
				mouseUpX = null;
				mouseUpX = null;
				
				if (players.length < maxNumberOfPlayers)
					AddNewPlayer();
			}
		}
		else
		{ // if there is dialog, don't detect click and draw without highlight
			DrawTextButton(btnX, btnY, btnW, btnH, "Add new player", false);
		}

	}

	function DrawCustomizationDialog()
	{
		// background tint
		ctx.beginPath();
		ctx.rect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
		ctx.fill();
		ctx.closePath();

		// dialog window
		let width = cw * 0.45;
		let height = cw * 0.25;
		let x = canvas.width / 2 - width / 2;
		let y = canvas.height / 2 - height / 2 - cw * 0.05;
		DrawNeonRect(x, y, width, height, "#333");
		ctx.fillStyle = "#222";
		DrawRectangle(x, y, width, height, 3, true);

		// player name
		let fontSize = cw * 0.025;
		//let nameX = x + width / 2 - ctx.measureText(players[playerCustomizationIndex].name).width / 2;	// stoped working for some reason
		let nameX = x + width / 2 - ctx.measureText(players[playerCustomizationIndex].name).width * 0.8;	// dirty fix for dirty bug
		let nameY = y + fontSize + cw * 0.01;
		let nameFont = "300 " + fontSize + "px Open sans";
		ctx.textAlign = "left";
		DrawNeonText(players[playerCustomizationIndex].name, nameX, nameY, nameFont, players[playerCustomizationIndex].color);

		// edit name button
		let buttonSize = cw * 0.02;
		let editNameButtonX = nameX + ctx.measureText(players[playerCustomizationIndex].name).width + cw * 0.02;
		let editNameButtonY = nameY - fontSize * 0.35 - buttonSize / 2;
		// draw button and detect click
		if (DrawButton(editNameButtonX, editNameButtonY, buttonSize, buttonSize, assets.images.ico_editNameNormal, assets.images.ico_editNameHover))
		{ // click detected
			mouseUpX = null;
			mouseUpX = null;
			editingNameIndex = playerCustomizationIndex;
			// logic of this click is in key handler
		}

		// draw blinking cursor
		if (editingNameIndex != null)
		{
			let nameYoffset = cw * 0.1;
			let cursorHeight = cw * 0.026;
			let cursorWidth = cw * 0.0008;
			let cursorX = nameX + ctx.measureText(players[playerCustomizationIndex].name).width + cw * 0.004;
			let cursorY = nameY - fontSize * 0.35 - cursorHeight / 2;
			ctx.beginPath();
			ctx.rect(cursorX, cursorY, cursorWidth, cursorHeight);
			ctx.fillStyle = "#eee";
			//ctx.shadowColor = players[playerCustomizationIndex].color;
			ctx.fill();
			ctx.shadowBlur = 10;
			if (Math.floor(new Date().getTime() / 1000 % 2))
			{
				ctx.fill();
				ctx.fill();
				ctx.fill();
				ctx.fill();
			}	
			ctx.closePath();
		}
		
		// draw colors
		for (let i = 0; i < colorPalette.length; i++)
		{
			for (let j = 0; j < colorPalette[i].length; j++)
			{
				let colorSpacing = cw * 0.015;
				let colorSize = cw * 0.017;
				let colorX = x + cw * 0.04 + j * (colorSize + colorSpacing);
				let colorY = y + cw * 0.08 + i * (colorSize + colorSpacing);

				if (PointIsInside(mouseX, mouseY, colorX, colorY, colorSize, colorSize))
				{ // mouse hover
					let sizeIncrease = 1.5;
					let coordShift = colorSize * 0.5 / 2;
					DrawNeonRect(colorX - coordShift, colorY - coordShift, colorSize*sizeIncrease, colorSize*sizeIncrease, colorPalette[i][j]);
					DrawNeonRect(colorX - coordShift, colorY - coordShift, colorSize*sizeIncrease, colorSize*sizeIncrease, colorPalette[i][j]);
				}
				else
				{ // normal mode
					DrawNeonRect(colorX, colorY, colorSize, colorSize, colorPalette[i][j]);
				}

				if (PointIsInside(mouseUpX, mouseUpY, colorX, colorY, colorSize, colorSize))
				{ // detect mouse click
					mouseUpX = null;
					mouseUpX = null;
					players[playerCustomizationIndex].color = colorPalette[i][j];
				}
			}	
		}

		// draw keybindings
		let count = 0;
		for (let keybinding of Object.entries(players[playerCustomizationIndex].keybindings))
		{
			// draw keybindings labels
			let fontSizeKeybind = cw * 0.015;
			let keybindingFont = "300 " + fontSizeKeybind + "px Open sans";
			let text = keybinding[0].charAt(0).toUpperCase() + keybinding[0].slice(1) + ":";
			let keybindSpacing = count * fontSizeKeybind * 1.7;
			count++;
			let keybindLabelX = x + width - cw * 0.2;
			let keybindLabelY = y + cw * 0.08 + keybindSpacing;
			DrawNeonText(text, keybindLabelX, keybindLabelY, keybindingFont, "#999", 10);

			// draw keybindings input fields
			let fieldW = cw * 0.1;
			let fieldH = cw * 0.02;
			let fieldX = keybindLabelX + cw * 0.06;
			let fieldY = keybindLabelY - fontSizeKeybind * 0.35 - fieldH / 2;
			if (PointIsInside(mouseX, mouseY, fieldX, fieldY, fieldW, fieldH))
			{ // mouse hover
				DrawNeonRect(fieldX, fieldY, fieldW, fieldH, "#222");
				DrawNeonRect(fieldX, fieldY, fieldW, fieldH, "#222");
			}
			else
			{ // normal mode
				DrawNeonRect(fieldX, fieldY, fieldW, fieldH, "#222");
			}
			if (editingKeybindIndex != null)
			{
				if (keybinding[0] == keybindAction)
					DrawNeonRect(fieldX, fieldY, fieldW, fieldH, players[playerCustomizationIndex].color);
			}

			if (PointIsInside(mouseUpX, mouseUpY, fieldX, fieldY, fieldW, fieldH))
			{ // detect mouse click
				mouseUpX = null;
				mouseUpX = null;
				editingKeybindIndex = playerCustomizationIndex;
				keybindAction = keybinding[0];
			}

			// keybinding text in field
			text = KeycodeToChar(keybinding[1][0]);
			if (text == null)
				text = "";	
			let keybindTextX = fieldX + fieldW / 2 - ctx.measureText(text).width / 2;
			let keybindTextY = keybindLabelY;
			DrawNeonText(text, keybindTextX, keybindTextY, keybindingFont, "#999", 10);

			// exclamation point for conflicts (dialog)
			let conflictDetected = false;
			for (let i = 0; i < players.length; i++)
			{
				for (let key of Object.entries(players[i].keybindings))
				{
					if (!(i == playerCustomizationIndex && keybinding[0] == key[0]))
					{ // skip self; check with all other keybindings
						if (keybinding[1][0] == key[1][0])
						{ // conflict detected
							conflictDetected = true;
						}
					}
				}
			}
			if (conflictDetected)
			{
				// draw exclamation
				let conflictTextX = fieldX;
				let conflictTextY = keybindLabelY;
				DrawNeonText("!", conflictTextX - cw * 0.01, conflictTextY, keybindingFont, "#e22", 10);
			}

		}

		// draw OK button
		let btnW = cw * 0.1;
		let btnH = cw * 0.03;
		let btnX = x + width / 2 - btnW / 2;
		let btnY = y + height - btnH - cw * 0.02;
		DrawTextButton(btnX, btnY, btnW, btnH, "OK");
		if (PointIsInside(mouseUpX, mouseUpY, btnX, btnY, btnW, btnH))
		{ // detect mouse click
			mouseUpX = null;
			mouseUpX = null;
			
			playerCustomizationIndex = null;
		}

			
	}

	function DrawTextButton(x, y, w, h, text, enabled = true)
	{
		let borderW = w;
		let borderH = h;
		let borderX = x;
		let borderY = y;
		let txt = text;
		let buttonFontSize = cw * 0.015;
		let buttonFont = "300 " + buttonFontSize + "px Open sans";
		let textX = borderX + borderW / 2;
		let textY = borderY + borderH / 2 + buttonFontSize * 0.35;

		if (PointIsInside(mouseX, mouseY, borderX, borderY, borderW, borderH) && enabled)
		{ // mouse hover
			DrawNeonRect(borderX, borderY, borderW, borderH, "#222");
			DrawNeonRect(borderX, borderY, borderW, borderH, "#222");
			
			ctx.textAlign = "center";
			DrawNeonText(txt, textX, textY, buttonFont, "#999", 10);
			ctx.textAlign = "left";
		}
		else
		{ // normal mode
			DrawNeonRect(borderX, borderY, borderW, borderH, "#222");
		}
		ctx.textAlign = "center";
		DrawNeonText(txt, textX, textY, buttonFont, "#999", 10);
		ctx.textAlign = "left";

		let clicked = false;
		if (PointIsInside(mouseUpX, mouseUpY, x, y, w, h))
		{ // detect mouse click
			clicked = true;
		}

		return clicked;
	}
	
	function KeycodeToChar(keycode)
	{
		mapKeycodeToChar = {8:"Backspace",9:"Tab",13:"Enter",16:"Shift",17:"Ctrl",18:"Alt",19:"Pause",20:"Caps Lock",27:"Esc",32:"Space",33:"Page Up",34:"Page Down",35:"End",36:"Home",37:"Left",38:"Up",39:"Right",40:"Down",45:"Insert",46:"Delete",48:"0",49:"1",50:"2",51:"3",52:"4",53:"5",54:"6",55:"7",56:"8",57:"9",65:"A",66:"B",67:"C",68:"D",69:"E",70:"F",71:"G",72:"H",73:"I",74:"J",75:"K",76:"L",77:"M",78:"N",79:"O",80:"P",81:"Q",82:"R",83:"S",84:"T",85:"U",86:"V",87:"W",88:"X",89:"Y",90:"Z",91:"Windows",93:"Right Click",96:"Num0",97:"Num1",98:"Num2",99:"Num3",100:"Num4",101:"Num5",102:"Num6",103:"Num7",104:"Num8",105:"Num9",106:"Num *",107:"Num +",109:"Num -",110:"Num .",111:"Num /",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"Num Lock",145:"Scroll Lock",182:"My Computer",183:"My Calculator",186:";",187:"=",188:",",189:"-",190:".",191:"/",192:"`",219:"[",220:"\\",221:"]",222:"'"};
		
		let result = mapKeycodeToChar[keycode];
		if (result != null || result != undefined)
			return result;
		else
			return null;
	}

	function DrawOtherMenuUI()
	{
		// title
		let font = "300 " + cw * 0.04 + "px Open sans";
		ctx.textAlign = "center";
		DrawNeonText("NEON SQUARE BATTLES", cw / 2, cw * 0.07, font, "#15f");
		DrawNeonText("NEON SQUARE BATTLES", cw / 2 + cw*0.0035, cw * 0.07, font, "#15f", 500);
		ctx.textAlign = "left";
		

		// Start button
		let btnW = cw * 0.12;
		let btnH = cw * 0.03;
		let btnX = canvas.width - canvas.width / 4 - btnW / 2;			// 3/4 of canvas width
		let btnY = canvas.height - cw * 0.11;
		DrawTextButton(btnX, btnY, btnW, btnH, "Start");
		if (PointIsInside(mouseUpX, mouseUpY, btnX, btnY, btnW, btnH))
		{ // detect mouse click
			mouseUpX = null;
			mouseUpX = null;
			
			gameState = "game";
		}

		// preview panel (placeholder)
		for (let i = 0; i < players.length; i++)
		{
			let squareW = cw * 0.06;
			let squareColor = players[i].color;
			DrawNeonRect(cw * 0.7+i*30, cw * 0.17+i*30, squareW, squareW, squareColor);
		}	
	}


	function MenuUpdate()
	{
		// draw default players and settings (or read from file)
		// on every change, update variables (and save to file)
		// on press play, change mode and call Update()

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		DrawPlayerNamesAndButtons();
		DrawOtherMenuUI();

		
		

		// dialog menus (draw this last)
		if (playerCustomizationIndex != null)
			DrawCustomizationDialog();
		
		
		if (gameState == "menu")
		{
			requestAnimationFrame(MenuUpdate);
		}
		else if (gameState == "game")
		{
			Update();	
		}

		
	}




};