<?php 

/*----------  OPTIONS  ----------*/

$url         = "upload/Katzen.mm"; // This will be set later by the uploader
$cachePath   = 'content/';
$enableCache = true;

/*=========================================
=            JSON file builder            =
=========================================*/

function getJSONFile($url) {
 
  global $cachePath;
  global $enableCache;

  // If there's no file: return error
  $fileContents= file_get_contents($url);
  if (!file_exists($url)) return error_log('File not found');

  // If file exists already: return content from file
  $hash = hash_file('md5', $url);
  
  $cacheFilename = $cachePath.$hash.'.json';

  if ($enableCache && file_exists($cacheFilename)) {
    // DEV: echo to console
    echo '<script>console.log("Found cachefile.")</script>';
    // Return the cache filename
    return $cacheFilename;
  }

  // read the file contents and convert JSON from Freemind XML structure
  $xml = simplexml_load_string($fileContents);

  $array = recursiveXML($xml)[0]; 
    // The calculated array is packed in an array, so we're taking it out of it.
  $json = json_encode($array);

  // Write result to file
  file_put_contents($cacheFilename, $json);

  // DEV: echo to console
  echo '<script>console.log("Built new cachefile.")</script>';

  // Return the cache filename
  return $cacheFilename;
}

/*=====================================================
=            Freemind-XML to readable JSON            =
=====================================================*/

function recursiveXML($xml) 
{

  // Kill the recursive loop if needed variables are null
  if ($xml == null) return false;

  /*----------  DYNAMIC VARIABLES  ----------*/
  $arr = null;

  foreach($xml->node as $key => $node) 
  {
    // Save results to variables
    $name = ($node['TEXT'] == null ? (string)$node['text'] : (string)$node['TEXT']);

    // Check if node has children. If yes, explore them and save them as an array of children
    // ATTENTION: This function is recursive.
    if(count($node->children()) == 0) // Found leaf node
    {
      $arr[] = array(
        "name" => $name
      );
    }
    else { // Has children
      $children = recursiveXML($node);
      $arr[] = array(
        "name" => $name,
        "children" => $children
      );
    } 
  }
  return $arr;
} 

/*============================================
=            XML depth calculator            =
============================================*/

function getXMLDepth($xml) {
  $max_depth = 1;

  // count depth up
  foreach ($xml->node as $value) {
    if ($value->children() != null) {
      $depth = getXMLDepth($value) + 1;

      // change max_depth if depth is higher
      if ($depth > $max_depth) {
          $max_depth = $depth;
      }
    }
  }

  return $max_depth;
}

/*----------  Returning area  ----------*/

$cachedJSON = getJSONFile($url);

?>
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">

    <!--iOS -->
    <meta name="apple-mobile-web-app-title" content="Kellertheater">
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
    
  </head>
  <body>
    <div id="sidebar">
      <header>
        Content
      </header>
      <div class="searchbar">
        <span class="icon-search"></span>
        <input type="text" id="search" name="q" size="21" maxlength="120" placeholder="Search...">
      </div>
      <div id="nodelist">
        
      </div>
    </div>
    <button id="menubutton" class="button">Menu</button>
    <button id="toRoot" class="button" disabled="true">Overview</button>
    <div id="content"></div>

    <script type="text/javascript">
      var file = '<?php echo $cachedJSON ?>';
    </script>
    <link rel='stylesheet' href='assets/css/base.css'>
    <link type="text/css" rel="stylesheet" href="vendors/d3/lib/colorbrewer/colorbrewer.css"/>
    <script type="text/javascript" src="vendors/d3/lib/colorbrewer/colorbrewer.js"></script>
    <script type="text/javascript" src="vendors/d3/d3.min.js"></script>
    <script src="vendors/d3-tip/index.js"></script>
    <script type="text/javascript" src="assets/scripts/venn.js"></script>
  </body>
</html>
