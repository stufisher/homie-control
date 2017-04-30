<?php 

namespace App\Modules\Property;
use App\BaseController as BaseController;

class Controller extends BaseController {

	// Property types
	protected function _get_ptypes() {
	    $rows = $this->db->pq("SELECT propertytypeid, name 
	        FROM propertytype
	        ORDER BY name");

	    $this->output($rows);
	}



	// Get Properties
	protected function _add_property() {
		$this->required('propertytypeid');
		$this->required('devicestring');
		$this->required('nodestring');
		$this->required('friendlyname');

	    $this->db->pq("INSERT INTO property (devicestring, nodestring, propertystring, propertytypeid, friendlyname) 
	        VALUES (:1, :2, :3, :4, :5)", 
	        [$this->args->value('devicestring'), $this->args->value('nodestring'), $this->args->value('propertystring'), $this->args->value('propertytypeid'), $this->args->value('friendlyname')]);

	    $this->output([ 'propertyid' => $this->db->id() ]);
	}


	// Set Property
	protected function _patch_property() {
		$this->required('propertyid');

	    if ($this->args->has('value')) {
	        $prop = $this->db->pq("SELECT devicestring, nodestring, propertystring FROM property WHERE propertyid=:1 AND propertystring IS NOT NULL", array($this->args->value('propertyid')));
	        if(!sizeof($prop)) $this->error('No such property');
	        $prop = $prop[0];

	        if ($this->mqtt->connect()) {
	        	$retained = 1;
	        	if ($this->args->has('retained')) {
	        		if ($this->args->value('retained') == 0) $retained = 0;
	        	}

	            $this->mqtt->publish($this->settings['homie']['base_topic'].'/'.$prop['devicestring'].'/'.$prop['nodestring'].'/'.$prop['propertystring'].'/set', $this->args->value('value'), 0, $retained);
	            $this->mqtt->close();
	            $this->output(new \stdClass);
	        }

	    } else {
	        foreach (['friendlyname', 'devicestring', 'nodestring', 'propertystring', 'propertytypeid'] as $k) {
	            if ($this->args->has($k)) {
	            	$v = $this->args->value($k);
	                $fl = ':1';
	                $this->db->pq("UPDATE property set $k=$fl WHERE propertyid=:2", [$v, $this->args->value('propertyid')]);
	                $this->output([ $k => $v ]);    
	            }
	        }
	    }
	}


	// Get Property
	protected function _get_properties() {
	    $where = '';
	    $args = array();

	    if ($this->args->has('propertygroupid')) {
	        $where .= ' AND pg.propertygroupid=:'.(sizeof($args)+1);
	        array_push($args, $this->args->value('propertygroupid'));
	    }

	    if ($this->args->has('propertysubgroupid')) {
	        $where .= ' AND psg.propertysubgroupid=:'.(sizeof($args)+1);
	        array_push($args, $this->args->value('propertysubgroupid'));
	    }

	    if ($this->args->has('option')) {
	        $where .= ' AND o.name LIKE :'.(sizeof($args)+1);
	        array_push($args, $this->args->value('option'));
	    }

	    if ($this->args->has('online')) {
	        $where .= " AND p.nodestring LIKE '\$online'";
	    }

	    if ($this->args->has('s')) {
	        $where .= " AND (p.friendlyname LIKE CONCAT('%',:".(sizeof($args)+1).",'%') OR p.devicestring LIKE CONCAT('%',:".(sizeof($args)+2).",'%') OR p.nodestring LIKE CONCAT('%',:".(sizeof($args)+3).",'%') OR p.propertystring LIKE CONCAT('%',:".(sizeof($args)+4).",'%'))";
	        array_push($args, $this->args->value('s'));
	        array_push($args, $this->args->value('s'));
	        array_push($args, $this->args->value('s'));
	        array_push($args, $this->args->value('s'));
	    }

	    if ($this->args->has('propertyid')) {
	        $where .= ' AND p.propertyid=:'.(sizeof($args)+1);
	        array_push($args, $this->args->value('propertyid'));
	    }

	    // $this->db->debug = True;
	    $tot = $this->db->pq("SELECT count(p.propertyid) as tot
	        FROM property p
	        LEFT OUTER JOIN propertygroupcomponent pgc ON pgc.propertyid = p.propertyid
	        LEFT OUTER JOIN propertygroup pg ON pgc.propertygroupid = pg.propertygroupid        
	        LEFT OUTER JOIN propertysubgroupcomponent psgc ON psgc.propertyid = p.propertyid
	        LEFT OUTER JOIN propertysubgroup psg ON psgc.propertysubgroupid = psg.propertysubgroupid
	        WHERE 1=1 $where", $args);
	    $tot = $tot[0]['tot'];

	    $dev = sizeof($args)+1;
	    array_push($args, $this->settings['homie']['base_topic']);

	    $start = 0;
	    $pp = $this->args->has('per_page') ? $this->args->value('per_page') : 15;
	    $end = $pp;
	    
	    if ($this->args->has('page')) {
	        $pg = $this->args->value('page') - 1;
	        $start = $pg*$pp;
	    }
	    
	    array_push($args, $start);
	    array_push($args, $end);

	    // GROUP_CONCAT(o.name) as options, 
	    // LEFT OUTER JOIN options o ON o.value = p.propertyid AND o.name LIKE '%_property'
	    // 
	    $props = $this->db->paginate("SELECT p.propertyid, CONCAT(:$dev, '/', p.devicestring, '/', p.nodestring, IF(p.propertystring IS NOT NULL, CONCAT('/', p.propertystring), '')) as address, p.devicestring, p.nodestring, p.propertystring, p.value, pg.propertygroupid, pg.name as propertygroup, psg.propertysubgroupid, psg.name as propertysubgroup, pt.name as propertytype, p.propertytypeid, p.friendlyname, p.icon
	        FROM property p
	        INNER JOIN propertytype pt ON p.propertytypeid = pt.propertytypeid
	        LEFT OUTER JOIN propertygroupcomponent pgc ON pgc.propertyid = p.propertyid
	        LEFT OUTER JOIN propertygroup pg ON pgc.propertygroupid = pg.propertygroupid        
	        LEFT OUTER JOIN propertysubgroupcomponent psgc ON psgc.propertyid = p.propertyid
	        LEFT OUTER JOIN propertysubgroup psg ON psgc.propertysubgroupid = psg.propertysubgroupid
	        WHERE 1=1 $where
	        GROUP BY p.propertyid
	        ORDER BY pg.propertygroupid,p.friendlyname", $args);

	    if ($this->args->has('propertyid')) {
	        if(!sizeof($props)) $this->error('No such property');
	        else $this->output($props[0]);
	    } else $this->output(['total' => $tot, 'data' => $props]);
	}



	// Get History
	protected function _get_history() {
	    $where = "l.timestamp > (now() - interval 1 day)";
	    $group = ", HOUR(l.timestamp), MINUTE(l.timestamp)";
	    $val = "AVG(l.value)";

	    if ($this->args->has('type')) {
	    	$t = $this->args->value('type');
	        if ($t == '48') {
	            $where = "l.timestamp > (now() - interval 2 day)";
	            $group = ", DAY(l.timestamp), HOUR(l.timestamp)";
	            $val = "AVG(l.value)";
	        }

	        if ($t == 'week') {
	            $where = "l.timestamp > (now() - interval 7 day)";
	            $group = ", DAY(l.timestamp), HOUR(l.timestamp)";
	            $val = "AVG(l.value)";
	        }

	        if ($t == 'monthd') {
	            $where = "l.timestamp > (now() - interval 1 month) AND HOUR(timestamp) >= 8 AND HOUR(timestamp) < 20";
	            $group = ", DAY(l.timestamp)";
	            $val = "AVG(l.value)";
	        }

	        if ($t == 'monthn') {
	            $where = "l.timestamp > (now() - interval 1 month) AND (HOUR(timestamp) < 8 OR HOUR(timestamp) >= 20)";
	            $group = ", DAY(l.timestamp)";
	            $val = "AVG(l.value)";
	        }
	    }

	    $args = [];
	    if ($this->args->has('propertygroupid', $q)) {
	        $where .= " AND pg.propertygroupid=:".(sizeof($args)+1);
	        array_push($args, $this->args->value('propertygroupid'));
	    }

	    if ($this->args->has('propertysubgroupid', $q)) {
	        $where .= " AND psg.propertysubgroupid=:".(sizeof($args)+1);
	        array_push($args, $this->args->value('propertysubgroupid'));
	    }

	    $rows = $this->db->pq("SELECT UNIX_TIMESTAMP(MAX(l.timestamp))*1000 as timestamp, $val as value, l.propertyid, p.propertytypeid, t.name as propertytype, pg.propertygroupid, psg.propertysubgroupid, p.friendlyname as propertyname, psgg.name as propertysubgroup, t.grouping
	        FROM history l
	        INNER JOIN property p ON p.propertyid = l.propertyid
	        INNER JOIN propertytype t ON p.propertytypeid = t.propertytypeid
	        LEFT OUTER JOIN propertygroupcomponent pg ON pg.propertyid = p.propertyid
	        LEFT OUTER JOIN propertysubgroupcomponent psg ON psg.propertyid = p.propertyid
	        LEFT OUTER JOIN propertysubgroup psgg ON psgg.propertysubgroupid = psg.propertysubgroupid
	        LEFT OUTER JOIN propertygroup pgg ON pgg.propertygroupid = pg.propertygroupid
	        WHERE pgg.history = 1 AND $where
	        GROUP BY l.propertyid $group 
	        ORDER BY timestamp", $args);

	    $data = [];
	    foreach ($rows as $r) {
	        if (!array_key_exists($r['propertyid'], $data))
	            $data[$r['propertyid']] = [
	                'data' => [], 
	                'propertyid' => $r['propertyid'],
	                'name' => $r['propertyname'],
	                'propertytype' => $r['propertytype'],
	                'propertysubgroupid' => $r['propertysubgroupid'],
	                'propertysubgroup' => $r['propertysubgroup'],
	                'grouping' => $r['grouping'],
	            ];

	        array_push($data[$r['propertyid']]['data'], [$r['timestamp'], $r['value']]);
	    }

	    $this->output(array_values($data));
	}


	// Get Usage
	protected function _get_usage() {
	    $ids = $args['location'] == 'back' ? '5,6,7,8' : '1,2,3,4';

	    $q = $request->getQueryParams();
	    $interval = 'weekday(timestamp)';
	    if (array_key_exists('type', $q)) {
	        if ($q['type'] == 'month') $interval = 'month(timestamp)';
	    }

	    $rows = $this->db->pq("SELECT id, (sum(sumtime)/3600)*240 as l, $interval as intv FROM ( 
	        SELECT id, timestamp, value, TIMESTAMPDIFF(SECOND, @lastdate, timestamp) as sumtime, value - @lastvalue as ch, @lastvalue:=value, @lastdate:=timestamp 
	        FROM log, (SELECT @lastdate:='') a, (SELECT @lastvalue:='') b 
	        WHERE id IN (".$ids.") AND typeid = 3
	        ORDER BY id,timestamp 
	        ) inr WHERE (ch = -1 or (ch=0 and value=1)) and sumtime > 0 and sumtime < 30
	        GROUP BY id, intv 
	        ORDER BY id,intv");

	    $data = [];
	    for ($i = 0; $i < 4; $i++) {
	        array_push($data, [ 'color' => $colors[$i][0], 'label' => 'Zone '.($i+1), 'data' => [] ]);
	    }


	    $offset = $args['location'] == 'back' ? 4 : 0;
	    foreach ($rows as $row) {
	        array_push($data[intval($row['id'])-$offset-1]['data'], [$row['intv'], floatval($row['l'])]);
	    }

	    $this->output($data);
	}

}
