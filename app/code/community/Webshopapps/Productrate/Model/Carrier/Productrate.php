<?php
/**
 *  Webshopapps Shipping Module
 *
 * @category   Webshopapps
 * @package    Webshopapps_Productrate
 * @copyright  Copyright (c) 2012 Zowta Ltd (http://www.webshopapps.com)
 * @license    http://www.webshopapps.com/license/license.txt - Commercial license
 * @author     Karen Baker <sales@webshopapps.com>
*/
class Webshopapps_Productrate_Model_Carrier_Productrate
    extends Mage_Shipping_Model_Carrier_Abstract
    implements Mage_Shipping_Model_Carrier_Interface
{

    protected $_code = 'productrate';
    
    protected $_modName = 'Webshopapps_Productrate';

    /**
     * FreeShipping Rates Collector
     *
     * @param Mage_Shipping_Model_Rate_Request $request
     * @return Mage_Shipping_Model_Rate_Result
     */
    public function collectRates(Mage_Shipping_Model_Rate_Request $request)
    {
       if (!$this->getConfigFlag('active')) {
            return false;
        }
        
        $freeBoxes = 0;
        if ($request->getAllItems()) {
            foreach ($request->getAllItems() as $item) {

                if ($item->getProduct()->isVirtual() || $item->getParentItem()) {
                    continue;
                }

                if ($item->getHasChildren() && $item->isShipSeparately()) {
                    foreach ($item->getChildren() as $child) {
                        if ($child->getFreeShipping() && !$child->getProduct()->isVirtual()) {
                            $freeBoxes += $item->getQty() * $child->getQty();
                        }
                    }
                } elseif ($item->getFreeShipping()) {
                    $freeBoxes += $item->getQty();
                }
            }
        }
        $this->setFreeBoxes($freeBoxes);
        
        

        $result = Mage::getModel('shipping/rate_result');

		$price = 0;

		$items = $request->getAllItems();

		$sumOfTotals = $this->getConfigData('totalling_algorithm') == 'S' ? true : false;

       	if ($request->getFreeShipping() === true || $request->getPackageQty() == $this->getFreeBoxes()) {
                $price = 0;
       	} else {

			$priceFound=false;
       		$bundledIdUsed = $this->getConfigData('bundle_id');

			$configurableQty = 0;
			$ignoreQty=0;
			foreach($items as $item) {
				if ($item->getFreeShipping() && !$item->getProduct()->isVirtual()) {
					$priceFound=true;
					continue;
				}

				$currentQty = $item->getQty();
				if ($item->getProductType() == Mage_Catalog_Model_Product_Type::TYPE_CONFIGURABLE) {
					$configurableQty = $currentQty;
					continue;
				} elseif ($configurableQty > 0) {
					$currentQty = $configurableQty;
					$configurableQty = 0;
				}
        		
				
				if ($item->getParentItem()!=null && $bundledIdUsed) {
        			$product = $item->getParentItem()->getProduct();
				} else {
        			$product = $item->getProduct();
				}

		        $shippingPrice 		= $product->getData('shipping_price');
		        $addOnPrice 		= $product->getData('shipping_addon');
		        $isPercentageAddOn 	= $product->getData('shipping_is_percent');

				$parentQty = 1;
				if ($item->getParentItem()!=null) {
					if ($item->getParentItem()->getProductType() == Mage_Catalog_Model_Product_Type::TYPE_BUNDLE) {
						$parentQty = $item->getParentItem()->getQty();
					}
				}
				
				if ($sumOfTotals) {
				
					if($shippingPrice)
					{
						$priceFound=true;
						$price += $shippingPrice;
				 	}
					
					$qty=($currentQty * $parentQty) -1;
					if ($shippingPrice==0) {
						$ignoreQty+=$qty+1;
					}
					$shippingAddOn = $addOnPrice;
					$shippingPercent =  $isPercentageAddOn;
					$shippingPrice =  $shippingPrice;
	
					if ($qty!=0)
					{
						if ($shippingPercent)
						{
							if ($shippingAddOn!='') {
								$price+=($shippingPrice*($shippingAddOn/100))*$qty;
							} else {
								$price+=$shippingPrice * $qty;
							}
						} else {
							if ($shippingAddOn!='') {
								$price+=$shippingAddOn * $qty;
							} else {
								$price+=$shippingPrice * $qty;
							}
						}
					}
				} else {
					if ($price < $shippingPrice) {
						$price = $shippingPrice;	
					}
				}
			}

			$max_shipping_cost=$this->getConfigData('max_shipping_cost');
			if (!empty($max_shipping_cost) && $max_shipping_cost!='' &&  $max_shipping_cost>0) {
				if ($price>$max_shipping_cost) {
					$price=$max_shipping_cost;
				}
			}


			if ($price==0 && !$priceFound) {
				if ($this->getConfigData('default_shipping_cost')!='') {
					$price=$this->getConfigData('default_shipping_cost');
				} else {
					if ($this->getConfigData('showmethod')) {
						$error = Mage::getModel('shipping/rate_result_error');
			            $error->setCarrier('productrate');
			            $error->setCarrierTitle($this->getConfigData('title'));
			            //$error->setErrorMessage($errorTitle);
			            $error->setErrorMessage($this->getConfigData('specificerrmsg'));
			            $result->append($error);
					}
					return $result;
				}
			}
			
	       	if (is_numeric($this->getConfigData('per_additional'))) {
	       		$qty=($request->getPackageQty() - $ignoreQty - $this->getFreeBoxes() - 1);
	       		if ($qty>0) {
					$addPrice = $this->getConfigData('per_additional') * ($request->getPackageQty() - $ignoreQty - $this->getFreeBoxes() - 1);
					$price+=$addPrice;
					$price = $price<0 ? 0 : $price;
	       		}
			}
			
       	}

		
       	
        $method = Mage::getModel('shipping/rate_result_method');
		

		$method->setCarrier('productrate');
		$method->setCarrierTitle($this->getConfigData('title'));

		$method->setMethod('productrate');
	    $price = $this->getFinalPriceWithHandlingFee($price);
	    if ($price==0 && $this->getConfigData('free_shipping_text')!='') {
	    	$modifiedName=preg_replace('/&|;| /'," ",$this->getConfigData('free_shipping_text'));
	   		$method->setMethodTitle($modifiedName);
	    } else {
	    	$modifiedName=preg_replace('/&|;| /'," ",$this->getConfigData('name'));
	    	
	   		$method->setMethodTitle($modifiedName);
	    }

		$method->setPrice($price);
		$method->setCost('0.00');

		$result->append($method);

        return $result;
    }

	public function getCode($type, $code='')
    {
        $codes = array(
            'totalling'=>array(
                'S'		=>	'Sum of Totals',
                'H'		=>	'Highest Price',
            ),
      );

        if (!isset($codes[$type])) {
//            throw Mage::exception('Mage_Shipping', Mage::helper('usa')->__('Invalid UPS CGI code type: %s', $type));
            return false;
        } elseif (''===$code) {
            return $codes[$type];
        }

        if (!isset($codes[$type][$code])) {
//            throw Mage::exception('Mage_Shipping', Mage::helper('usa')->__('Invalid UPS CGI code for type %s: %s', $type, $code));
            return false;
        } else {
            return $codes[$type][$code];
        }
    }
            

    public function getAllowedMethods()
    {
        return array('productrate'=>$this->getConfigData('name'));
    }

}
