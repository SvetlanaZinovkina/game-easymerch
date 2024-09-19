function Game() {
  this.state = {
    width: 40,
    height: 24,
    heroPosition: { x: 0, y: 0 },
    heroHealth: 100,
    heroPowerUp: false,
    powerUpDuration: 10000,
    rooms: [],
    map: [],
    enemies: [],
    potions: 10,
    swords: 2,
  };

  var self = this;

  this.init = function () {
    this.generateMap();
    this.generateRooms();
    this.generateCorridors();
    this.placeItems();
    this.placeHeroAndEnemies();
    this.renderMap();
    this.startEnemyMovement();
    this.checkHeroHealth();
    this.checkForHealthPotion();
    this.updateInventory();
  };

  this.generateMap = function () {
    for (var y = 0; y <= this.state.height; y++) {
      this.state.map[y] = [];
      for (var x = 0; x <= this.state.width; x++) {
        this.state.map[y][x] = 'W'; // Стены
      }
    }
  };

  this.renderMap = function () {
    $('.field').empty();
    for (var y = 0; y <= this.state.height; y++) {
      for (var x = 0; x <= this.state.width; x++) {
        var tileClass;
        switch (this.state.map[y][x]) {
          case 'W':
            tileClass = 'tileW';
            break;
          case '.':
            tileClass = 'tile';
            break;
          case 'P':
            tileClass = 'tileP';
            break;
          case 'HP':
            tileClass = 'tileHP';
            break;
          case 'SW':
            tileClass = 'tileSW';
            break;
          case 'E':
            tileClass = 'tileE';
            break;
          default:
            tileClass = 'tile';
            break;
        }
        var tile = $(
          '<div class="tile ' +
            tileClass +
            '" style="left:' +
            x * 25 +
            'px;top:' +
            y * 25 +
            'px;"></div>'
        );

        if (this.state.map[y][x] === 'P') {
          var healthBarWidth = Math.max(0, this.state.heroHealth) + '%';
          tile.append(
            '<div class="health" style="width:' + healthBarWidth + ';"></div>'
          );
        }

        if (this.state.map[y][x] === 'E') {
          var enemy = this.state.enemies.find(e => e.x === x && e.y === y);
          var healthEnemiesWidth = Math.max(0, enemy.health) + '%';
          tile.append(
            '<div class="health" style="width:' +
              healthEnemiesWidth +
              '; background-color: red;"></div>'
          );
        }

        $('.field').append(tile);
      }
    }
  };

  this.generateRooms = function () {
    var roomCount = Math.floor(Math.random() * 6) + 5;

    for (var i = 0; i < roomCount; i++) {
      var roomWidth = Math.floor(Math.random() * 6) + 3;
      var roomHeight = Math.floor(Math.random() * 6) + 3;
      var startX = Math.floor(Math.random() * (this.state.width - roomWidth));
      var startY = Math.floor(Math.random() * (this.state.height - roomHeight));

      for (var y = startY; y < startY + roomHeight; y++) {
        for (var x = startX; x < startX + roomWidth; x++) {
          this.state.map[y][x] = '.';
        }
      }

      this.state.rooms.push({
        x: startX + Math.floor(roomWidth / 2),
        y: startY + Math.floor(roomHeight / 2),
      });
    }
  };

  this.generateCorridors = function () {
    for (var i = 1; i < this.state.rooms.length; i++) {
      var roomA = this.state.rooms[i - 1];
      var roomB = this.state.rooms[i];

      this.createCorridor(roomA.x, roomA.y, roomB.x, roomB.y);
    }
  };

  this.createCorridor = function (x1, y1, x2, y2) {
    for (var x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      this.state.map[y1][x] = '.';
    }

    for (var y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      this.state.map[y][x2] = '.';
    }
  };

  this.placeItems = function () {
    var swords = 2;
    var potions = 10;

    while (swords > 0) {
      var x = Math.floor(Math.random() * this.state.width);
      var y = Math.floor(Math.random() * this.state.height);
      if (this.state.map[y][x] === '.') {
        this.state.map[y][x] = 'SW';
        swords--;
      }
    }

    while (potions > 0) {
      var x = Math.floor(Math.random() * this.state.width);
      var y = Math.floor(Math.random() * this.state.height);
      if (this.state.map[y][x] === '.') {
        this.state.map[y][x] = 'HP';
        potions--;
      }
    }
  };

  this.placeHeroAndEnemies = function () {
    do {
      var x = Math.floor(Math.random() * this.state.width);
      var y = Math.floor(Math.random() * this.state.height);
    } while (this.state.map[y][x] !== '.');
    this.state.map[y][x] = 'P';
    this.state.heroPosition = { x: x, y: y };

    var enemies = 10;
    while (enemies > 0) {
      var x = Math.floor(Math.random() * this.state.width);
      var y = Math.floor(Math.random() * this.state.height);
      if (this.state.map[y][x] === '.') {
        this.state.map[y][x] = 'E';
        var enemyHealth = 100;
        var axis = Math.random() < 0.5 ? 'x' : 'y';
        var direction = Math.random() < 0.5 ? -1 : 1;
        this.state.enemies.push({
          x: x,
          y: y,
          axis: axis,
          direction: direction,
          health: enemyHealth,
        });
        enemies--;
      }
    }
  };

  this.moveHero = function (dx, dy) {
    var newX = this.state.heroPosition.x + dx;
    var newY = this.state.heroPosition.y + dy;
    if (
      newX >= 0 &&
      newX < this.state.width &&
      newY >= 0 &&
      newY < this.state.height &&
      this.state.map[newY][newX] !== 'W'
    ) {
      this.state.map[this.state.heroPosition.y][this.state.heroPosition.x] =
        '.';
      this.state.heroPosition = { x: newX, y: newY };
      this.checkForHealthPotion();
      this.checkForSword();
      this.state.map[newY][newX] = 'P';
      this.updateInventory();
      this.renderMap();
    }
  };

  this.attack = function () {
    var heroX = this.state.heroPosition.x;
    var heroY = this.state.heroPosition.y;

    var neighbors = [
      { x: heroX - 1, y: heroY },
      { x: heroX + 1, y: heroY },
      { x: heroX, y: heroY - 1 },
      { x: heroX, y: heroY + 1 },
    ];

    for (var i = 0; i < neighbors.length; i++) {
      var neighbor = neighbors[i];
      if (
        neighbor.x >= 0 &&
        neighbor.x < this.state.width &&
        neighbor.y >= 0 &&
        neighbor.y < this.state.height
      ) {
        var enemy = this.state.enemies.find(
          e => e.x === neighbor.x && e.y === neighbor.y
        );
        if (enemy) {
          if (this.state.heroPowerUp) {
            this.state.enemies = this.state.enemies.filter(e => e !== enemy);
            this.state.map[neighbor.y][neighbor.x] = '.';
          } else {
            enemy.health -= 50;
            if (enemy.health <= 0) {
              this.state.enemies = this.state.enemies.filter(e => e !== enemy);
              this.state.map[neighbor.y][neighbor.x] = '.';
            }
          }
        }
      }
    }
    this.checkEnemiesCount();
    this.renderMap();
  };

  this.enemyAttackHero = function () {
    var heroX = this.state.heroPosition.x;
    var heroY = this.state.heroPosition.y;

    var neighbors = [
      { x: heroX - 1, y: heroY },
      { x: heroX + 1, y: heroY },
      { x: heroX, y: heroY - 1 },
      { x: heroX, y: heroY + 1 },
    ];

    for (var i = 0; i < neighbors.length; i++) {
      var neighbor = neighbors[i];
      if (
        neighbor.x >= 0 &&
        neighbor.x < this.state.width &&
        neighbor.y >= 0 &&
        neighbor.y < this.state.height
      ) {
        if (this.state.map[neighbor.y][neighbor.x] === 'E') {
          this.state.heroHealth -= 10;
          if (this.state.heroHealth <= 0) {
            this.checkHeroHealth();
          }
        }
      }
    }

    this.renderMap();
  };

  this.startEnemyMovement = function () {
    setInterval(function () {
      self.moveEnemies();
    }, 1000);
  };

  this.moveEnemies = function () {
    for (var i = 0; i < this.state.enemies.length; i++) {
      var enemy = this.state.enemies[i];
      var newX = enemy.x;
      var newY = enemy.y;

      if (enemy.axis === 'x') {
        newX = enemy.x + enemy.direction;
      } else {
        newY = enemy.y + enemy.direction;
      }

      if (
        newX >= 0 &&
        newX < this.state.width &&
        newY >= 0 &&
        newY < this.state.height &&
        this.state.map[newY][newX] === '.'
      ) {
        this.state.map[enemy.y][enemy.x] = '.';
        this.state.map[newY][newX] = 'E';
        enemy.x = newX;
        enemy.y = newY;
      } else if (this.state.map[newY][newX] === 'P') {
        this.enemyAttackHero();
      } else {
        enemy.direction *= -1;
      }
    }

    this.renderMap();
    this.enemyAttackHero();
  };

  this.checkHeroHealth = function () {
    if (this.state.heroHealth <= 0) {
      alert('Герой погиб! Игра окончена.');
      this.resetGame();
      if (confirm('Хотите начать игру заново?')) {
        this.init();
      }
    }
  };

  this.checkEnemiesCount = function () {
    if (this.state.enemies.length <= 0) {
      alert('Вы выиграли');
      this.resetGame();
      if (confirm('Хотите сыграть ещё раз?')) {
        this.init();
      }
    }
  };

  this.checkForHealthPotion = function () {
    var heroX = this.state.heroPosition.x;
    var heroY = this.state.heroPosition.y;
    if (this.state.map[heroY][heroX] === 'HP') {
      this.state.heroHealth = Math.min(this.state.heroHealth + 10, 100);
      this.state.potions--;
      this.state.map[heroY][heroX] = '.';
      this.renderMap();
      this.updateInventory();
    }
  };

  this.checkForSword = function () {
    var heroX = this.state.heroPosition.x;
    var heroY = this.state.heroPosition.y;

    if (this.state.map[heroY][heroX] === 'SW') {
      this.state.heroPowerUp = true;
      this.state.map[heroY][heroX] = '.';
      this.state.swords--;
      this.updateInventory();
      this.renderMap();

      setTimeout(() => {
        this.state.heroPowerUp = false;
      }, this.state.powerUpDuration);
    }
  };

  this.updateInventory = function () {
    var inventory = $('.inventory');
    inventory.empty();

    var potionsDiv = $(
      '<div class="inventory-item" >Зелья: <span id="potions-count">' +
        this.state.potions +
        '</span></div>'
    );
    inventory.append(potionsDiv);

    var swordsDiv = $(
      '<div class="inventory-item">Мечи: <span id="swords-count">' +
        this.state.swords +
        '</span></div>'
    );
    inventory.append(swordsDiv);

    var enemiesDiv = $(
      '<div class="inventory-item">Враги: <span id="enemies-count">' +
        this.state.enemies.length +
        '</span></div>'
    );
    inventory.append(enemiesDiv);

    var powerUpStatus = this.state.heroPowerUp ? 'Да' : 'Нет';
    var powerDiv = $(
      '<div class="inventory-item">Усиление: <span id="powerboost-count">' +
        powerUpStatus +
        '</span></div>'
    );
    inventory.append(powerDiv);
  };

  this.resetGame = function () {
    this.state.heroHealth = 100;
    this.state.heroPowerUp = false;
    this.state.map = [];
    this.state.enemies = [];
    this.state.potions = 10;
    this.state.swords = 2;
  };

  $(document).keydown(function (e) {
    switch (e.which) {
      case 87:
        self.moveHero(0, -1);
        break;
      case 65:
        self.moveHero(-1, 0);
        break;
      case 83:
        self.moveHero(0, 1);
        break;
      case 68:
        self.moveHero(1, 0);
        break;
      case 32:
        self.attack();
        break;
    }
  });
}
