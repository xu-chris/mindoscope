<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">

    <title>Mind-o-scope</title>

    <!--iOS -->
    <meta name="apple-mobile-web-app-title" content="Mindoscope">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="apple-touch-icon-precomposed" href="assets/img/app-icons/iTunesArtwork.png">

    <link rel="apple-touch-icon-precomposed" sizes="29x29" href="assets/img/app-icons/AppIcon29x29.png">
    <link rel="apple-touch-icon-precomposed" sizes="58x58" href="assets/img/app-icons/AppIcon29x29@2x.png">

    <link rel="apple-touch-icon-precomposed" sizes="40x40" href="assets/img/app-icons/AppIcon40x40.png">
    <link rel="apple-touch-icon-precomposed" sizes="80x80" href="assets/img/app-icons/AppIcon40x40@2x.png">

    <link rel="apple-touch-icon-precomposed" sizes="50x50" href="assets/img/app-icons/AppIcon50x50.png">
    <link rel="apple-touch-icon-precomposed" sizes="100x100" href="assets/img/app-icons/AppIcon50x50@2x.png">

    <link rel="apple-touch-icon-precomposed" sizes="57x57" href="assets/img/app-icons/AppIcon57x57.png">
    <link rel="apple-touch-icon-precomposed" sizes="114x114" href="assets/img/app-icons/AppIcon57x57@2x.png">

    <link rel="apple-touch-icon-precomposed" sizes="60x60" href="assets/img/app-icons/AppIcon60x60.png">
    <link rel="apple-touch-icon-precomposed" sizes="120x120" href="assets/img/app-icons/AppIcon60x60@2x.png">

    <link rel="apple-touch-icon-precomposed" sizes="72x72" href="assets/img/app-icons/AppIcon72x72.png">
    <link rel="apple-touch-icon-precomposed" sizes="144x144" href="assets/img/app-icons/AppIcon72x72@2x.png">

    <link rel="apple-touch-icon-precomposed" sizes="76x76" href="assets/img/app-icons/AppIcon76x76.png">
    <link rel="apple-touch-icon-precomposed" sizes="152x152" href="assets/img/app-icons/AppIcon76x76@2x.png">

    <link rel='stylesheet' href='assets/css/base.css'>
    <link type="text/css" rel="stylesheet" href="vendors/d3/lib/colorbrewer/colorbrewer.css"/>
    <script type="text/javascript" src="vendors/d3/lib/colorbrewer/colorbrewer.js"></script>
    <script type="text/javascript" src="vendors/d3/d3.min.js"></script>
    <script src="vendors/d3-tip/index.js"></script>
    <script type="text/javascript" src="assets/scripts/venn.js"></script>

    <link href="vendors/dropzone/dist/min/dropzone.min.css" type="text/css" rel="stylesheet" />

  </head>
  <body>
    <div id="upload">
      <form action="upload.php" class="dropzone" id="dropzone">
        <span>
        <div class="fallback">
          <input type="file" accept="application/mm" name="file" /></span>
        </div>
      </form>
      <script type="text/javascript" src="vendors/dropzone/dist/min/dropzone.min.js"></script>
      <script>
        dropzoneElement = d3.select('#dropzone');
        Dropzone.options.dropzone = {
          maxFilesize: 2, // MB
          dictDefaultMessage: "<strong>Drag and drop your Mind Map here</strong><br>(or click to choose)",
          dictInvalidFileType: "Was it a freemind file? Retry please.",
          dictFileTooBig: "Uuh that's too big. Sorry",
          success: function(file, response) {
            dropzoneElement
              .classed('hover', false)
              .classed('error', false)
              .classed('dropped', false)
              .classed('success', true);
            setTimeout(buildMindmap(response), 300);
          },
          dragover: function() {
            dropzoneElement
              .classed('hover', true)
              .classed('error', false)
              .classed('dropped', false)
              .classed('success', false);
          },
          dragleave: function() {
            dropzoneElement
              .classed('hover', false)
              .classed('error', false)
              .classed('dropped', false)
              .classed('success', false);
          },
          drop: function() {
            dropzoneElement
              .classed('hover', false)
              .classed('error', false)
              .classed('dropped', true)
              .classed('success', false);
          },
          error: function() {
            dropzoneElement
              .classed('hover', false)
              .classed('error', true)
              .classed('dropped', false)
              .classed('success', false);
          }
        }
      </script>
    </div>
    <div id="mindmap">
      <div id="sidebar">
        <header>
          Content
        </header>
        <div class="searchbar">
          <span class="icon-search"></span>
          <input type="text" id="search" size="21" maxlength="120" placeholder="Search">
        </div>
        <div class="content">
          <div id="settings">
            <div class="heading">General</div>
            <label class="option" type="switch" value="false" for="hideVisited">
              <input class="tgl" id="hideVisited" name="showinhero" type="checkbox">
              <label class="tgl-btn" for="hideVisited"></label>
              Hide visited nodes
            </label>

            <label class="option" type="switch" value="false" for="hideLabels">
              <input class="tgl" id="hideLabels" name="hideLabels" type="checkbox">
              <label class="tgl-btn" for="hideLabels"></label>
              Hide Labels
            </label>

            <label class="option" type="switch" value="false" for="disableTooltip">
              <input class="tgl" id="disableTooltip" name="disableTooltip" type="checkbox">
              <label class="tgl-btn" for="disableTooltip"></label>
              Disable tooltips
            </label>
            <div class="heading">Animation</div>
            <form  class="option" onsubmit="return false" oninput="level.value = zoomDurationLevel.valueAsNumber + ' ms'">
              <div>Zoom duration time:</div>
              <div class="range-field">
                <input type="range" id="zoomDuration" name="zoomDurationLevel" min="0" max="1500" value="750" />
                <output for="zoomDuration" name="level" id="zoomDurationOutput">750 ms</output>
              </div>
            </form>
           </div>
            <div class="scrollmask">
              <div id="nodelist" class="show"></div>
            </div>
          </div>
          <footer>
            <span class="icon-share-alt"></span>
            <input type="text" id="shareURL" size="21" maxlength="120" onClick="this.setSelectionRange(0, this.value.length)">
            <button class="icon-cog button" id="openSettings"></button>
          </footer>
        </div>
        <button id="menubutton" class="button">Menu</button>
        <button id="searchterm" class="button"></button>
        <button id="toRoot" class="button" disabled="true">Overview</button>
        <div id="path"><div class="content"></div></div>
        <div id="content"></div>
      </div>
    <?php

      $cachePath   = 'content/';
      $enableCache = true;

      $uri = explode('?', ltrim($_SERVER['REQUEST_URI'],"/"), 2)[0];

      $fileURL = $cachePath.$uri.'.json';

      if ($uri != "" && file_exists($fileURL) && $enableCache) {
        echo '<script>
            buildMindmap("'.$uri.'");
          </script>';
      }

    ?>
  </body>
</html>
