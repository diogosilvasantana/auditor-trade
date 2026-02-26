try {
    console.log("Loading main.js...");
    require('./dist/main.js');
} catch (e) {
    console.error("REAL ERROR:");
    console.error(e);
}
