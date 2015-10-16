<?php
  // DEV Stuff
  // error_reporting(E_ALL);
  // ini_set("display_errors", 1);

  $visitedNodes = (isset($_GET["visited"]) && $_GET["visited"] != "" ? "checked" : null );
  $labels = (isset($_GET["labels"]) && $_GET["labels"] != "" ? "checked" : null );
  $tooltips = (isset($_GET["tooltips"]) && $_GET["tooltips"] != "" ? "checked" : null );
  $zoom = (isset($_GET["zoom"]) && $_GET["zoom"] != "" ? $_GET["zoom"] : 750 );

  // Detect mobile devices
  require_once 'vendors/mobile-detect/Mobile_Detect.php';
  $detect = new Mobile_Detect;

  // Tooltips doesn't make sense on mobile touch devices.
  if($detect->isMobile()) $tooltips = "checked";

?>
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">

    <title>Mind-o-scope</title>

    <!--iOS -->
    <meta name="apple-mobile-web-app-title" content="Mind-o-scope">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
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

    <link rel="stylesheet" href="assets/css/base.css">

    <link rel="stylesheet" href="assets/scripts/libs/introjs/introjs.css">

    <script type="text/javascript" src="assets/scripts/libs/d3/d3.min.js"></script>
    <script type="text/javascript" src="assets/scripts/plugins/d3/d3-tip/index.js"></script>

    <script type="text/javascript" src="assets/scripts/app.js"></script>

  </head>
  <body id="evaluation">
    <div id="quest">
      <div class="container">
        <div class="quest" id="quest1">
          <span><strong>Aufgabe 1</strong></span>
          <span>Tun Sie, was Sie wollen.</span>
          <a class="start button" onclick="showMindmap(1)">Start</a>
        </div>
        <div class="quest" id="quest2">
          <span><strong>Aufgabe 2</strong></span>
          <span>Suchen Sie den Knoten "Gattung Otocolobus".</span>
          <a class="start button" onclick="showMindmap(2)">Start</a>
        </div>
        <div class="quest" id="quest3">
          <span><strong>Aufgabe 3</strong></span>
          <span>Suchen Sie den Knoten "Pupillen". Bitte fragen Sie den anwesenden Leiter der Evaluation, wie Sie den Knoten suchen sollen.</span>
          <a class="start button" onclick="showMindmap(3)">Start</a>
        </div>
        <div class="quest" id="quest4">
          <span><strong>Aufgabe 4</strong></span>
          <span>Bitte füllen Sie die folgenden Fragebögen aus. Beginnen Sie mit dem ersten Fragebogen:</span>
          <a class="start button" onclick="markClicked(this); donequestionnaire1 = true; showThankYou();" href="http://eval.attrakdiff.de/attrakdiff.php?id=b05076567e204c682dfa54df71613348&step=1&lang=de" target="_blank">Fragebogen 1</a>
          <a class="start button" onclick="markClicked(this); donequestionnaire2 = true; showThankYou();" href="https://de.surveymonkey.com/r/6P5M53S" target="_blank">Fragebogen 2</a>
        </div>
        <div class="quest" id="thankyou">
          <span class="icon-heart"></span>
          <span>Vielen Dank für Ihre Teilnahme!</span>
        </div>
      </div>
      <script type="text/javascript">
        var questno = 1;
        var donequestionnaire1 = false;
        var donequestionnaire2 = false;

        var timeOut;

        function showQuest (number) {
          d3.select('#mindmap').style('display', 'none');
          d3.select('body').style('position', 'relative');
          d3.select('#quest').style('display', 'block');
          d3.select('#quest .container').selectAll('div').style('display', 'none');
          d3.select('#quest'+number).style('display', 'block');
          clearTimeout(timeOut);
        }

        function showMindmap (number) {
          d3.select('#quest').style('display', 'none');
          buildMindmap("evaluation", 750);

          questno++;

          timeOut = setTimeout(function() {
            showQuest(questno);
          }, 5 * 60 * 1000);
        }

        function markClicked (el) {
          d3.select(el).classed('clicked', true);
        }

        function showThankYou() {
          if (donequestionnaire1 && donequestionnaire2) {
            setTimeout(function() {
              d3.select('#mindmap').style('display', 'none');
              d3.select('body').style('position', 'relative');
              d3.select('#quest').style('display', 'block');
              d3.select('#quest .container').selectAll('div').style('display', 'none');
              d3.select('#thankyou').style('display', 'block');
            },1000)
          }
        }
      </script>
    </div>
    <div id="upload">
      <form action="upload.php" class="dropzone" id="dropzone">
        <div id="dropzone-template">
          <div class="dz-preview dz-file-preview">
            <div class="dz-details">
              <div class="dz-filename"><span data-dz-name></span></div>
            </div>
            <div class="dz-progress"><div class="dz-upload" data-dz-uploadprogress></div></div>
            <div class="dz-success-mark"><span>✔</span></div>
            <div class="dz-error-mark"><span class="icon-times"></span></div>
            <div class="dz-error-message"><span data-dz-errormessage></span></div>
          </div>
        </div>
        <div class="fallback">
          <input type="file" accept="application/mm" name="file" />
        </div>
      </form>
      <script type="text/javascript" src="assets/scripts/libs/dropzone/dist/min/dropzone.min.js"></script>
      <script>
        dropzoneElement = d3.select('#dropzone');
        Dropzone.options.dropzone = {
          previewTemplate: document.querySelector('#dropzone-template').innerHTML,
          maxFilesize: 2, // MB
          dictDefaultMessage: "<strong>Drag and drop your .mm file here</strong><br>(or click to choose)",
          clickable: true,
          success: function(file, response) {
            dropzoneElement
              .classed('hover', false)
              .classed('error', false)
              .classed('dropped', false)
              .classed('success', true);
            _this = this;
            setTimeout(function() {
              buildMindmap(response, <?php echo $zoom ?>);
              _this.removeAllFiles();
              _this.enable();
            }, 1000);
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
          error: function(file, response) {
            dropzoneElement
              .classed('hover', false)
              .classed('error', true)
              .classed('dropped', false)
              .classed('success', false);
            _this.enable();
          }
        }
      </script>
    </div>
    <div id="mindmap">
      <div id="sidebar">
        <header>
          Inhalt
        </header>
        <div class="searchbar">
          <label for="search" class="icon-search"></label>
          <input type="text" id="search" size="21" maxlength="120" placeholder="Suchen">
        </div>
        <div class="content">
          <div id="settings">
            <div class="heading">Allgemein</div>
            <label class="option" type="switch" value="false" for="hideVisited">
              <input class="tgl" id="hideVisited" name="hideVisited" type="checkbox" <?php echo $visitedNodes ?>>
              <label class="tgl-btn" for="hideVisited"></label>
              Besuchte Knoten ausblenden
            </label>

            <label class="option" type="switch" value="false" for="hideLabels">
              <input class="tgl" id="hideLabels" name="hideLabels" type="checkbox" <?php echo $labels ?>>
              <label class="tgl-btn" for="hideLabels"></label>
              Bezeichnungen deaktivieren
            </label>

            <label class="option" type="switch" value="false" for="disableTooltip">
              <input class="tgl" id="disableTooltip" name="disableTooltip" type="checkbox" <?php echo $tooltips ?>>
              <label class="tgl-btn" for="disableTooltip"></label>
              Tooltips deaktivieren
            </label>
            <div class="heading">Animation</div>
            <form  class="option range" onsubmit="return false" oninput="level.value = zoomDurationLevel.valueAsNumber">
              <div>Zoomgeschwindigkeit:</div>
              <div class="range-field">
                <input type="range" id="zoomDuration" name="zoomDurationLevel" min="0" max="1500" value="<?php echo $zoom ?>" />
                <output for="zoomDuration" name="level" id="zoomDurationOutput"><?php echo $zoom ?></output>
              </div>
            </form>
            <div class="optionbottom">
              <div class="heading">Mindmap</div>
              <div class="option button-group justified" role="group">
                <a id="download" class="button">Download</a>
                <a id="new" class="button">Neu</a>
                <a id="delete" class="button danger" disabled="true">Löschen</a>
              </div>
            </div>
            </div>
            <div class="scrollmask">
              <div id="treelist" class="show"></div>
            </div>
          </div>
          <footer>
            <label for="shareURL" class="icon-share-alt"></label>
            <input type="text" id="shareURL" size="21" maxlength="120" onClick="this.setSelectionRange(0, this.value.length)">
            <button class="icon-cog button" id="openSettings"></button>
          </footer>
        </div>
        <div class="topUI">
          <button id="tourbutton" href="javascript:void(0);" onclick="startIntro();" class="button">Tour starten</button>
          <button id="menubutton" class="button">Menü</button>
        </div>
        <button id="searchterm" class="button"></button>
        <button id="toRoot" class="button" disabled="true">Übersicht</button>
        <button id="finishedQuest" class="button" onclick="showQuest(questno)">Fertig</button>
        <div id="path"><div class="content"></div></div>
        <div id="content"></div>
      </div>
    <script type="text/javascript" src="assets/scripts/libs/introjs/intro.js"></script>
    <script type="text/javascript">
      function startIntro(){
        var intro = introJs();
          intro.setOptions({
            tooltipPosition: 'auto',
            positionPrecedence: ['left', 'right', 'bottom', 'top'],
            steps: [
              {
                intro: "Hier sind einige Tipps, um diese Darstellung zu nutzen."
              },
              {
                element: '#content',
                intro: "Das ist Ihre Mindmap, visualisiert als Euler-Diagramm."
              },
              {
                element: '#content',
                intro: "Sie können in dieser hineinzoomen, indem Sie einen Kreis Ihrer Wahl anklicken."
              },
              {
                element: '#content',
                intro: "Sie können herauszoomen, indem Sie nochmals auf den selben Kreis klicken. Oder indem Sie benachbarte Keise anklicken."
              },
              {
                element: '#toRoot',
                intro: "Um zur Übersicht zurückzukehren, können Sie einfach auf diesen Button klicken."
              },
              {
                element: '#path',
                intro: "Das ist der aktuell-angezeigte Pfad. Dieser geht vom Stammknoten bis zum aktuell selektierten Knoten.<br /><br />Aktuell befinden Sie sich im Stammknoten. Daher wird aktuell kein anderer Knoten dort angezeigt."
              },
              {
                element: '#sidebar .content',
                intro: "Das ist die eine hierarchische Listenansicht ihrer Mindmap. Hier können Sie ebenfalls den Knoten auswählen, den Sie sich anschauen möchten."
              },
              {
                element: '.searchbar',
                intro: "Sie können Wörter oder auch nur einige Buchstabenkombinationen hier eintippen, um Knoten zu finden."
              },
              {
                element: '#shareURL',
                intro: "Das ist die Internetadresse, mit der Sie diese Mindmap mit anderen teilen können.",
                position: 'top'
              },
              {
                element: '#openSettings',
                intro: "Wenn Sie mit der Zoomgeschwindigkeit oder anderen Anzeigeeinstellungen nicht zufrieden sind, können Sie hier die Einstellungen ganz nach Ihren Bedürfnissen anpassen."
              },
              {
                element: '#openSettings',
                intro: "Hier können Sie ebenfalls Aktionen finden, um die Mindmap herunter zu laden, sie zu löschen oder eine neue Mindmap hochzuladen. <br /><br />Während der Evaluation sind diese Funktionalitäten allerdings eingeschränkt nutzbar."
              },
              {
                element: '#menubutton',
                intro: "Hinter diesem Button finden Sie die gesamte Seitenleiste."
              },
              {
                element: '#tourbutton',
                intro: "Viel Spaß mit der Darstellung. Sollten Sie Hilfe benötigen, können Sie diese Tour wieder mit einen Klick auf diesen Button starten oder den anwesenden Leiter der Evaluation fragen."
              }
            ]
          });

          intro.start();
      }

    </script>

    <?php

      $cachePath   = 'uploaded';
      $ds   = DIRECTORY_SEPARATOR;
      $enableCache = true;

      $url = $_SERVER['REQUEST_URI'];
      $urlEnd = end((explode('/', rtrim($url, '/'))));;
      $hash = strtok($urlEnd,'?');

      $fileURL = $cachePath.$ds.$hash.'.json';

      if ($hash != "" && file_exists($fileURL) && $enableCache) {
        echo '
          <script type="text/javascript">
              buildMindmap("'.$hash.'", '.$zoom.');
          </script>';
      }

    ?>
  </body>
</html>
