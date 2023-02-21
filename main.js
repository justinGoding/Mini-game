const gameEngine = new GameEngine();

const ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload("./sprites/penguin.png");
ASSET_MANAGER.queueDownload("./sprites/ice.png");
ASSET_MANAGER.queueDownload("./sprites/bell.png");
ASSET_MANAGER.queueDownload("./sprites/win_screen.png");
ASSET_MANAGER.queueDownload("./sprites/death.png");
ASSET_MANAGER.queueDownload("./sprites/damaged_penguin.png");

ASSET_MANAGER.downloadAll(() => {
	const canvas = document.getElementById("gameWorld");
	const ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;

	gameEngine.init(ctx);

	gameEngine.start();

	setScale.addEventListener('click', function(e) {
		//params.scale = document.getElementById("scale").value;
		//clearEntities();
		//ctx.canvas.width =  10 * tileSize * params.scale;
		//ctx.canvas.height = 8 * tileSize * params.scale;
		//ctx.imageSmoothingEnabled = false;
	});
});
