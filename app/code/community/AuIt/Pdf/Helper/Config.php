<?php
/**
 * AuIt
 *
 * @category   AuIt
 * @author     M Augsten
 * @copyright  Copyright (c) 2010 Ingenieurbüro (IT) Dipl.-Ing. Augsten (http://www.au-it.de)
 */
class AuIt_Pdf_Helper_Config extends Mage_Core_Helper_Abstract
{

	public function getDefaults($path)
    {
    	// MAU 09.10.2012 - Default aus der Website holen
    	$v = Mage::app()->getWebsite()->getConfig($path);
    	if ( $v )
    	{
    		if ( strpos($v,'base64:') === 0 )
    		{
    			$v = base64_decode(substr($v,7));

    			$v=@unserialize($v);
    			if ( is_array($v) )
    			{
    				$b=true;
    				foreach ( array ('/billingaddress','/shippingaddress','/table_margins','/table_margins2') as $c )
    				{
						if ( strpos($path,$c) != false )
						{
							$b=false;break;
						}    					
    				}
    				if ( $b )
    					return $v;
    			}
    		}
    	}
    	$prefix='1';
    	$pathx = explode('/',$path);
    	array_pop($pathx);
    	$pathx = implode('/',$pathx);
    	switch ( $pathx )
    	{
    		case 'auit_pdf/invoice':
    			$prefix='1';
    			break;
    		case 'auit_pdf/shipment':
    			$prefix='2';
    			break;
			case 'auit_pdf/creditmemo':
				$prefix='3';
    			break;
			case 'auit_pdf/auit_offer':
				$prefix='4';
    			break;
    	}
    	switch ( $path )
    	{
    		case 'auit_pdf/invoice/billingaddress':
   			case 'auit_pdf/auit_offer/billingaddress':
			case 'auit_pdf/creditmemo/billingaddress':
   			case 'auit_pdf/shipment/shippingaddress':
				return array(
    				'4d80867196679'.$prefix=>array('x'=>'20','y'=>'60','w'=>80,'h'=>35,'class'=>'billingaddress')
    			);
    		break;
			case 'auit_pdf/shipment/billingaddress_old':
    			return array(
    				'4d80867196679'.$prefix=>array('x'=>'0','y'=>'0','w'=>0,'h'=>0,'class'=>'')
    			);
    		break;
    		case 'auit_pdf/auit_offer/shippingaddress':
    		case 'auit_pdf/invoice/shippingaddress':
    			return array(
    				'4d80867196679'.$prefix=>array('x'=>'130','y'=>'60','w'=>60,'h'=>35,'class'=>'shippingaddress')
    			);
    		break;
    		case 'auit_pdf/invoice/free_page_1':
    			return array(
    				'4d80865c64d67'.$prefix=>array('name'=>'Invoice #',
    							'x'=>'165','y'=>'9','w'=>'35','h'=>'5',
    							'value'=>'{{var invoice.increment_id}}',
    							'class'=>'big'
    					),
    				'4d8086c41e0d3'.$prefix=>array('name'=>'Order Date',
    							'x'=>'165','y'=>'16','w'=>'35','h'=>'5',
    							'value'=>'{{var invoice_date}}',
    							'class'=>''
    							),
					'4d8331b7d3bbe'.$prefix=>array('name'=>'Order #',
    							'x'=>'165','y'=>'21.2','w'=>'35','h'=>'5',
    							'value'=>'{{var order.real_order_id}}',
    							'class'=>''
								),
					'4d8086c41e0d4'.$prefix=>array('name'=>'Order Date',
    							'x'=>'165','y'=>'26.4','w'=>'35','h'=>'5',
    							'value'=>'{{var order_date}}',
    							'class'=>''
    							),
    				'4d8086bef0420'.$prefix=>array('name'=>'Customer ID',
    							'x'=>'165','y'=>'31.7','w'=>'35','h'=>'5',
    							'value'=>'K-{{var order.customer_id}}',
    							'class'=>''),
    				'4d8086c9ea6f2'.$prefix=>array('name'=>'Remote IP',
    							'x'=>'50','y'=>'280','w'=>'35','h'=>'5',
    							'value'=>'{{var order.remote_ip}}',
    							'class'=>'creator'),
    				'4d80878c25541'.$prefix=>array('name'=>'Creator',
    							'x'=>'23','y'=>'280','w'=>'40','h'=>'5',
    							'value'=>'powered by auit.de',
    							'class'=>'creator'
    							),
    				'4d8088f8e1feb'.$prefix=>array('name'=>'Page number',
    							'x'=>'20','y'=>'285','w'=>'180','h'=>'5',
    							'value'=>'{{var page_current}}/{{var page_count}}',
    							'class'=>'pagenr'),
    				'4d8088f8e1fec'.$prefix=>array('name'=>'Bar code',
    							'x'=>'178','y'=>'55','w'=>'40','h'=>'',
    							'value'=>'{{block type=\'core/template\' area=\'frontend\' template=\'auit/pdf/barcodes/shipment.phtml\' invoice=$invoice }}',
    							'class'=>'')
 							);
    		break;
    		case 'auit_pdf/auit_offer/free_page_1':
			return array(
    				'4d80865c64d67'.$prefix=>array('name'=>'Order #',
    							'x'=>'165','y'=>'9','w'=>'35','h'=>'5',
    							'value'=>'{{var order.real_order_id}}',
    							'class'=>'big'
    					),
					'4d8086c41e0d4'.$prefix=>array('name'=>'Order Date',
    							'x'=>'165','y'=>'26.4','w'=>'35','h'=>'5',
    							'value'=>'{{var order_date}}',
    							'class'=>''
    							),
    				'4d8086bef0420'.$prefix=>array('name'=>'Customer ID',
    							'x'=>'165','y'=>'31.7','w'=>'35','h'=>'5',
    							'value'=>'K-{{var order.customer_id}}',
    							'class'=>''),
    				'4d8086c9ea6f2'.$prefix=>array('name'=>'Remote IP',
    							'x'=>'50','y'=>'280','w'=>'35','h'=>'5',
    							'value'=>'{{var order.remote_ip}}',
    							'class'=>'creator'),
    				'4d80878c25541'.$prefix=>array('name'=>'Creator',
    							'x'=>'23','y'=>'280','w'=>'40','h'=>'5',
    							'value'=>'powered by auit.de',
    							'class'=>'creator'
    							),
    				'4d8088f8e1feb'.$prefix=>array('name'=>'Page number',
    							'x'=>'20','y'=>'285','w'=>'180','h'=>'5',
    							'value'=>'{{var page_current}}/{{var page_count}}',
    							'class'=>'pagenr'),
    				'4d8088f8e1fec'.$prefix=>array('name'=>'Bar code',
    							'x'=>'178','y'=>'55','w'=>'40','h'=>'',
    							'value'=>'{{block type=\'core/template\' area=\'frontend\' template=\'auit/pdf/barcodes/shipment.phtml\' invoice=$invoice }}',
    							'class'=>'')
 							);
    		break;
    		case 'auit_pdf/creditmemo/free_page_1':
    			return array(
    				'4d80865c64d67'.$prefix=>array('name'=>'Invoice #',
    							'x'=>'165','y'=>'9','w'=>'35','h'=>'5',
    							'value'=>'{{var invoice.increment_id}}',
    							'class'=>'big'
    					),
    				'4d8086c41e0d3'.$prefix=>array('name'=>'Order Date',
    							'x'=>'165','y'=>'16','w'=>'35','h'=>'5',
    							'value'=>'{{var invoice_date}}',
    							'class'=>''
    							),
					'4d8331b7d3bbe'.$prefix=>array('name'=>'Order #',
    							'x'=>'165','y'=>'21.2','w'=>'35','h'=>'5',
    							'value'=>'{{var order.real_order_id}}',
    							'class'=>''
								),
					'4d8086c41e0d4'.$prefix=>array('name'=>'Order Date',
    							'x'=>'165','y'=>'26.4','w'=>'35','h'=>'5',
    							'value'=>'{{var order_date}}',
    							'class'=>''
    							),
    				'4d8086bef0420'.$prefix=>array('name'=>'Customer ID',
    							'x'=>'165','y'=>'31.7','w'=>'35','h'=>'5',
    							'value'=>'K-{{var order.customer_id}}',
    							'class'=>''),
    				'4d8086c9ea6f2'.$prefix=>array('name'=>'Remote IP',
    							'x'=>'50','y'=>'280','w'=>'35','h'=>'5',
    							'value'=>'{{var order.remote_ip}}',
    							'class'=>'creator'),
    				'4d80878c25541'.$prefix=>array('name'=>'Creator',
    							'x'=>'23','y'=>'280','w'=>'40','h'=>'5',
    							'value'=>'powered by auit.de',
    							'class'=>'creator'
    							),
    				'4d8088f8e1feb'.$prefix=>array('name'=>'Page number',
    							'x'=>'20','y'=>'285','w'=>'180','h'=>'5',
    							'value'=>'{{var page_current}}/{{var page_count}}',
    							'class'=>'pagenr')
 							);
    		break;
    		case 'auit_pdf/auit_offer/free_page_n':
    		case 'auit_pdf/invoice/free_page_n':
    		case 'auit_pdf/creditmemo/free_page_n':
   			case 'auit_pdf/shipment/free_page_n':
    			return array(
    				'4d80902be9514'.$prefix=>array('name'=>'Creator',
    							'x'=>'23','y'=>'280','w'=>'40','h'=>'5',
    							'value'=>'powered by auit.de',
    							'class'=>'creator'
    							),
    				'4d8088da677aa'.$prefix=>array('name'=>'Page number',
    							'x'=>'20','y'=>'285','w'=>'180','h'=>'5',
    							'value'=>'{{var page_current}}/{{var page_count}}',
    							'class'=>'pagenr'));
    		break;
    		case 'auit_pdf/shipment/table_margins_old':
    			return array(
    			'4d821d72512ec'.$prefix=>array('left'=>'16','top1'=>'50','topn'=>'20','right'=>'5','bottom'=>'15'),
    			);
    			break;
    		case 'auit_pdf/shipment/table_margins':
    		case 'auit_pdf/auit_offer/table_margins':
    		case 'auit_pdf/invoice/table_margins':
			case 'auit_pdf/creditmemo/table_margins':
				return array(
    				'4d821d72512ec'.$prefix=>array('left'=>'20','top1'=>'110','topn'=>'20','right'=>'5','bottom'=>'50'),
				);
    		break;
    		case 'auit_pdf/auit_offer/table_margins2':
    		case 'auit_pdf/invoice/table_margins2':
    		case 'auit_pdf/creditmemo/table_margins2':
   			case 'auit_pdf/shipment/table_margins2':
    			$mp = str_replace('table_margins2','table_margins',$path);
    			$margins = (array)Mage::helper('auit_pdf/arrayconfig')->getArrayStoreConfig($mp);
    			if ( count($margins) )
    			{
    				$margins = array_shift($margins);
    				if ( !isset($margins['topn']))
    					$margins['topn']='20';
    				return array(
   						'4d821d72512ed'.$prefix=>array('left'=>$margins['left'],'top1'=>$margins['topn'],'right'=>$margins['right'],'bottom'=>$margins['bottom']),
    				);
    			}
    			return array(
	    			'4d821d72512ed'.$prefix=>array('left'=>'20','top1'=>'110','topn'=>'20','right'=>'5','bottom'=>'50'),
    			);
    			break;

    		case 'auit_pdf/shipment/shippingaddress_old':
    			return array(
    				'4d80867196679'.$prefix=>array('x'=>'19','y'=>'22','w'=>60,'h'=>35,'class'=>'shippingaddress')
    			);
    		break;
    		case 'auit_pdf/'.'l':
				return Mage::helper('auit_pdf')->getLText();
    		case 'auit_pdf/shipment/free_page_1_old':
    			return array(
					'4d8331b7d3bbe'.$prefix=>array('name'=>'Order #',
    							'x'=>'50','y'=>'7','w'=>'35','h'=>'5',
    							'value'=>'{{var order.real_order_id}}',
    							'class'=>''
								),
    				'4d8086bef0420'.$prefix=>array('name'=>'Customer ID',
    							'x'=>'50','y'=>'12.0','w'=>'35','h'=>'5',
    							'value'=>'K-{{var invoice.customer_id}}',
    							'class'=>''),
    				'4d80878c25541'.$prefix=>array('name'=>'Creator',
    							'x'=>'20','y'=>'137','w'=>'40','h'=>'5',
    							'value'=>'powered by auit.de',
    							'class'=>'creator'
    							),
    				'4d8088f8e1feb'.$prefix=>array('name'=>'Page number',
    							'x'=>'20','y'=>'35','w'=>'175','h'=>'5',
    							'value'=>'{{var page_current}}/{{var page_count}}',
    							'class'=>'pagenr'),
    				'4d8088f8e1fed'.$prefix=>array('name'=>'Bar code',
    							'x'=>'65','y'=>'15','w'=>'40','h'=>'',
    							'value'=>'{{block type=\'core/template\' area=\'frontend\' template=\'auit/pdf/barcodes/shipment.phtml\' invoice=$invoice }}',
    							'class'=>'')
				);
			case 'auit_pdf/shipment/free_page_1':
				return array(
						'4d80865c64d67'.$prefix=>array('name'=>'Invoice #',
								'x'=>'165','y'=>'9','w'=>'35','h'=>'5',
								'value'=>'{{var entity.increment_id}}',
								'class'=>'big'
						),
						'4d8086c41e0d3'.$prefix=>array('name'=>'Order Date',
								'x'=>'165','y'=>'16','w'=>'35','h'=>'5',
								'value'=>'{{var entity_date}}',
								'class'=>''
						),
						'4d8331b7d3bbe'.$prefix=>array('name'=>'Order #',
								'x'=>'165','y'=>'21.2','w'=>'35','h'=>'5',
								'value'=>'{{var order.real_order_id}}',
								'class'=>''
						),
						'4d8086c41e0d4'.$prefix=>array('name'=>'Order Date',
								'x'=>'165','y'=>'26.4','w'=>'35','h'=>'5',
								'value'=>'{{var order_date}}',
								'class'=>''
						),
						'4d8086bef0420'.$prefix=>array('name'=>'Customer ID',
								'x'=>'165','y'=>'31.7','w'=>'35','h'=>'5',
								'value'=>'K-{{var order.customer_id}}',
								'class'=>''),
						'4d8086c9ea6f2'.$prefix=>array('name'=>'Remote IP',
								'x'=>'50','y'=>'280','w'=>'35','h'=>'5',
								'value'=>'{{var order.remote_ip}}',
								'class'=>'creator'),
						'4d80878c25541'.$prefix=>array('name'=>'Creator',
								'x'=>'23','y'=>'280','w'=>'40','h'=>'5',
								'value'=>'powered by auit.de',
								'class'=>'creator'
						),
						'4d8088f8e1feb'.$prefix=>array('name'=>'Page number',
								'x'=>'20','y'=>'285','w'=>'180','h'=>'5',
								'value'=>'{{var page_current}}/{{var page_count}}',
								'class'=>'pagenr')
				);

    		break;
    		case 'auit_pdf/shipment/free_page_n_old':
    			return array(
    				'4d80902be9514'.$prefix=>array('name'=>'Creator',
    							'x'=>'20','y'=>'137','w'=>'40','h'=>'5',
    							'value'=>'powered by auit.de',
    							'class'=>'creator'
    							),
    				'4d8088da677aa'.$prefix=>array('name'=>'Page number',
    							'x'=>'20','y'=>'136','w'=>'175','h'=>'5',
    							'value'=>'{{var page_current}}/{{var page_count}}',
    							'class'=>'pagenr'));
    		break;
    		case 'auit_pdf/shipment/billingaddress':
    		case 'auit_pdf/creditmemo/shippingaddress':
    			return array(
    				'4d80867196679'.$prefix=>array('x'=>'0','y'=>'0','w'=>0,'h'=>0,'class'=>'')
    			);
    		break;
    	}
    	return '';
    }

}