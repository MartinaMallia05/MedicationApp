<?php
namespace App;

use Twig\Environment;
use Twig\Loader\FilesystemLoader;

class TwigConfig
{
    public static function render($template, $data = [])
    {
        // Updated path to templates directory
        $loader = new FilesystemLoader(__DIR__ . '/../templates');
        $twig = new Environment($loader, [
            'cache' => false, 
            'debug' => true,
            'autoescape' => 'html'
        ]);

        return $twig->render($template, $data);
    }
}