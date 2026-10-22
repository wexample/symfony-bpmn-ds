<?php

namespace Wexample\SymfonyBpmnDs\Traits;

use Wexample\SymfonyBpmnDs\WexampleSymfonyBpmnDsBundle;
use Wexample\SymfonyHelpers\Traits\BundleClassTrait;

trait SymfonyBpmnDsBundleClassTrait
{
    use BundleClassTrait;

    public static function getBundleClassName(): string
    {
        return WexampleSymfonyBpmnDsBundle::class;
    }
}
