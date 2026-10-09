<?php

namespace Wexample\SymfonyBpmnDs\Controller\Pages;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Wexample\SymfonyBpmn\Service\BpmnViewService;
use Wexample\SymfonyBpmnDs\Traits\SymfonyBpmnDsBundleClassTrait;
use Wexample\SymfonyHelpers\Helper\VariableHelper;
use Wexample\SymfonyLoader\Controller\AbstractPagesController;

/**
 * The processes of the registry, and each one's sheet: drawn, walked path by
 * path, who may act at each task, what its validation says.
 *
 * The pages hold no data of their own: their components read it from the api
 * of symfony-bpmn, through the repositories generated from its entities. The
 * page knows the process by its id, and that it exists.
 */
#[Route(path: '/bpmn/', name: 'bpmn_')]
final class BpmnController extends AbstractPagesController
{
    use SymfonyBpmnDsBundleClassTrait;

    final public const string ROUTE_INDEX = VariableHelper::INDEX;

    final public const string ROUTE_PROCESS = 'process';

    #[Route(path: '', name: self::ROUTE_INDEX)]
    public function index(
        #[Autowire(param: 'wexample_symfony_bpmn.view_role')]
        string $viewRole,
    ): Response {
        $this->denyAccessUnlessGranted($viewRole);

        return $this->renderPage(self::ROUTE_INDEX);
    }

    #[Route(path: '{process}', name: self::ROUTE_PROCESS)]
    public function process(
        string $process,
        BpmnViewService $view,
        #[Autowire(param: 'wexample_symfony_bpmn.view_role')]
        string $viewRole,
    ): Response {
        $this->denyAccessUnlessGranted($viewRole);

        if (! $view->has($process)) {
            throw new NotFoundHttpException(sprintf('No process "%s".', $process));
        }

        return $this->renderPage(self::ROUTE_PROCESS, [
            'process' => $view->process($process),
        ]);
    }
}
