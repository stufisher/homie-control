-- phpMyAdmin SQL Dump
-- version 4.5.4.1deb2ubuntu2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Sep 15, 2016 at 12:00 PM
-- Server version: 5.7.13-0ubuntu0.16.04.2
-- PHP Version: 7.0.8-0ubuntu0.16.04.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `logging`
--

-- --------------------------------------------------------

--
-- Table structure for table `device`
--

CREATE TABLE `device` (
  `deviceid` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `macaddress` varchar(17) NOT NULL,
  `ipaddress` varchar(15) DEFAULT NULL,
  `dccount` int(11) NOT NULL DEFAULT '0',
  `connected` tinyint(1) NOT NULL DEFAULT '0',
  `active` tinyint(4) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `devicetrigger`
--

CREATE TABLE `devicetrigger` (
  `devicetriggerid` int(11) NOT NULL,
  `deviceid` int(11) DEFAULT NULL,
  `connected` tinyint(4) NOT NULL,
  `propertyprofileid` int(11) DEFAULT NULL,
  `requiresunset` tinyint(4) NOT NULL DEFAULT '0',
  `requirelast` tinyint(4) NOT NULL DEFAULT '0',
  `active` tinyint(4) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `history`
--

CREATE TABLE `history` (
  `historyid` int(11) NOT NULL,
  `propertyid` int(11) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `value` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `options`
--

CREATE TABLE `options` (
  `optionid` int(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `value` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `options`
--

INSERT INTO `options` (`optionid`, `name`, `value`) VALUES
(3, 'latitude', '45.1885'),
(4, 'longitude', '5.7245'),
(5, 'timezone', 'Europe/Paris'),
(6, 'heating_reading_property', '16'),
(7, 'heating_control_property', '23'),
(8, 'profile_exec_property', '82'),
(9, 'trigger_email_to', 'you@server.com');

-- --------------------------------------------------------

--
-- Table structure for table `pages`
--

CREATE TABLE `pages` (
  `pageid` int(11) NOT NULL,
  `title` varchar(30) NOT NULL,
  `slug` varchar(30) NOT NULL,
  `template` varchar(30) NOT NULL,
  `config` text,
  `display_order` int(11) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `property`
--

CREATE TABLE `property` (
  `propertyid` int(11) NOT NULL,
  `devicestring` varchar(8) NOT NULL,
  `nodestring` varchar(30) NOT NULL,
  `propertystring` varchar(30) DEFAULT NULL,
  `propertytypeid` int(11) DEFAULT NULL,
  `friendlyname` varchar(30) DEFAULT NULL,
  `value` double DEFAULT NULL,
  `icon` varchar(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `propertygroup`
--

CREATE TABLE `propertygroup` (
  `propertygroupid` int(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `history` tinyint(4) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `propertygroupcomponent`
--

CREATE TABLE `propertygroupcomponent` (
  `propertygroupcomponentid` int(11) NOT NULL,
  `propertyid` int(11) NOT NULL,
  `propertygroupid` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `propertyprofile`
--

CREATE TABLE `propertyprofile` (
  `propertyprofileid` int(11) NOT NULL,
  `propertygroupid` int(11) DEFAULT NULL,
  `propertysubgroupid` int(11) DEFAULT NULL,
  `name` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `propertyprofilecomponent`
--

CREATE TABLE `propertyprofilecomponent` (
  `propertyprofilecomponentid` int(11) NOT NULL,
  `propertyprofileid` int(11) NOT NULL,
  `propertyid` int(11) NOT NULL,
  `value` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `propertysubgroup`
--

CREATE TABLE `propertysubgroup` (
  `propertysubgroupid` int(11) NOT NULL,
  `propertygroupid` int(11) DEFAULT NULL,
  `name` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `propertysubgroupcomponent`
--

CREATE TABLE `propertysubgroupcomponent` (
  `propertysubgroupcomponentid` int(11) NOT NULL,
  `propertyid` int(11) NOT NULL,
  `propertysubgroupid` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `propertytrigger`
--

CREATE TABLE `propertytrigger` (
  `propertytriggerid` int(11) NOT NULL,
  `propertyid` int(11) NOT NULL,
  `value` double NOT NULL,
  `comparator` varchar(2) NOT NULL,
  `propertyprofileid` int(11) DEFAULT NULL,
  `scheduleid` int(11) DEFAULT NULL,
  `schedulestatus` int(11) DEFAULT NULL,
  `email` tinyint(1) DEFAULT NULL,
  `delay` int(11) NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `propertytype`
--

CREATE TABLE `propertytype` (
  `propertytypeid` int(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `grouping` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `propertytype`
--

INSERT INTO `propertytype` (`propertytypeid`, `name`, `grouping`) VALUES
(1, 'online', 0),
(2, 'temperature', 1),
(3, 'motion', 3),
(4, 'temperatureset', 1),
(5, 'enable', 3),
(6, 'override', 3),
(7, 'switch', 3),
(8, 'humidity', 2),
(9, 'humidityset', 2),
(10, 'shutter', 3),
(11, 'executer', 0);

-- --------------------------------------------------------

--
-- Table structure for table `schedule`
--

CREATE TABLE `schedule` (
  `scheduleid` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `start` datetime NOT NULL,
  `end` datetime NOT NULL,
  `propertyid` int(11) DEFAULT NULL,
  `requiredevice` tinyint(1) NOT NULL DEFAULT '0',
  `invert` tinyint(4) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `schedulecomponent`
--

CREATE TABLE `schedulecomponent` (
  `schedulecomponentid` int(11) NOT NULL,
  `scheduleid` int(11) NOT NULL,
  `day` int(11) NOT NULL,
  `start` time NOT NULL,
  `end` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `suntrigger`
--

CREATE TABLE `suntrigger` (
  `suntriggerid` int(11) NOT NULL,
  `sunset` int(11) NOT NULL,
  `propertyprofileid` int(11) DEFAULT NULL,
  `requiredevice` tinyint(1) NOT NULL,
  `active` tinyint(4) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `device`
--
ALTER TABLE `device`
  ADD PRIMARY KEY (`deviceid`);

--
-- Indexes for table `devicetrigger`
--
ALTER TABLE `devicetrigger`
  ADD PRIMARY KEY (`devicetriggerid`),
  ADD KEY `deviceid` (`deviceid`),
  ADD KEY `deviceid_2` (`deviceid`),
  ADD KEY `propertyprofileid` (`propertyprofileid`);

--
-- Indexes for table `history`
--
ALTER TABLE `history`
  ADD PRIMARY KEY (`historyid`),
  ADD KEY `propertyid` (`propertyid`),
  ADD KEY `timestamp` (`timestamp`);

--
-- Indexes for table `options`
--
ALTER TABLE `options`
  ADD PRIMARY KEY (`optionid`),
  ADD KEY `name` (`name`);

--
-- Indexes for table `pages`
--
ALTER TABLE `pages`
  ADD PRIMARY KEY (`pageid`);

--
-- Indexes for table `property`
--
ALTER TABLE `property`
  ADD PRIMARY KEY (`propertyid`),
  ADD KEY `typeid` (`propertytypeid`);

--
-- Indexes for table `propertygroup`
--
ALTER TABLE `propertygroup`
  ADD PRIMARY KEY (`propertygroupid`);

--
-- Indexes for table `propertygroupcomponent`
--
ALTER TABLE `propertygroupcomponent`
  ADD PRIMARY KEY (`propertygroupcomponentid`),
  ADD KEY `propertyid` (`propertyid`),
  ADD KEY `propertygroupid` (`propertygroupid`);

--
-- Indexes for table `propertyprofile`
--
ALTER TABLE `propertyprofile`
  ADD PRIMARY KEY (`propertyprofileid`),
  ADD KEY `propertygroupid` (`propertygroupid`),
  ADD KEY `propertysubgroupid` (`propertysubgroupid`);

--
-- Indexes for table `propertyprofilecomponent`
--
ALTER TABLE `propertyprofilecomponent`
  ADD PRIMARY KEY (`propertyprofilecomponentid`),
  ADD KEY `propertyid` (`propertyid`),
  ADD KEY `propertyprofileid` (`propertyprofileid`);

--
-- Indexes for table `propertysubgroup`
--
ALTER TABLE `propertysubgroup`
  ADD PRIMARY KEY (`propertysubgroupid`),
  ADD KEY `propertygroupid` (`propertygroupid`);

--
-- Indexes for table `propertysubgroupcomponent`
--
ALTER TABLE `propertysubgroupcomponent`
  ADD PRIMARY KEY (`propertysubgroupcomponentid`),
  ADD KEY `propertyid` (`propertyid`),
  ADD KEY `propertysubgroupid` (`propertysubgroupid`);

--
-- Indexes for table `propertytrigger`
--
ALTER TABLE `propertytrigger`
  ADD PRIMARY KEY (`propertytriggerid`),
  ADD KEY `propertyid` (`propertyid`),
  ADD KEY `propertyprofileid` (`propertyprofileid`),
  ADD KEY `scheduleid` (`scheduleid`);

--
-- Indexes for table `propertytype`
--
ALTER TABLE `propertytype`
  ADD PRIMARY KEY (`propertytypeid`);

--
-- Indexes for table `schedule`
--
ALTER TABLE `schedule`
  ADD PRIMARY KEY (`scheduleid`),
  ADD KEY `propertyid` (`propertyid`);

--
-- Indexes for table `schedulecomponent`
--
ALTER TABLE `schedulecomponent`
  ADD PRIMARY KEY (`schedulecomponentid`),
  ADD KEY `scheduleid` (`scheduleid`);

--
-- Indexes for table `suntrigger`
--
ALTER TABLE `suntrigger`
  ADD PRIMARY KEY (`suntriggerid`),
  ADD KEY `propertyprofileid` (`propertyprofileid`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `device`
--
ALTER TABLE `device`
  MODIFY `deviceid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `devicetrigger`
--
ALTER TABLE `devicetrigger`
  MODIFY `devicetriggerid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT for table `history`
--
ALTER TABLE `history`
  MODIFY `historyid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=686635;
--
-- AUTO_INCREMENT for table `options`
--
ALTER TABLE `options`
  MODIFY `optionid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
--
-- AUTO_INCREMENT for table `pages`
--
ALTER TABLE `pages`
  MODIFY `pageid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;
--
-- AUTO_INCREMENT for table `property`
--
ALTER TABLE `property`
  MODIFY `propertyid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;
--
-- AUTO_INCREMENT for table `propertygroup`
--
ALTER TABLE `propertygroup`
  MODIFY `propertygroupid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;
--
-- AUTO_INCREMENT for table `propertygroupcomponent`
--
ALTER TABLE `propertygroupcomponent`
  MODIFY `propertygroupcomponentid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=106;
--
-- AUTO_INCREMENT for table `propertyprofile`
--
ALTER TABLE `propertyprofile`
  MODIFY `propertyprofileid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT for table `propertyprofilecomponent`
--
ALTER TABLE `propertyprofilecomponent`
  MODIFY `propertyprofilecomponentid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;
--
-- AUTO_INCREMENT for table `propertysubgroup`
--
ALTER TABLE `propertysubgroup`
  MODIFY `propertysubgroupid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;
--
-- AUTO_INCREMENT for table `propertysubgroupcomponent`
--
ALTER TABLE `propertysubgroupcomponent`
  MODIFY `propertysubgroupcomponentid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=95;
--
-- AUTO_INCREMENT for table `propertytrigger`
--
ALTER TABLE `propertytrigger`
  MODIFY `propertytriggerid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `propertytype`
--
ALTER TABLE `propertytype`
  MODIFY `propertytypeid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;
--
-- AUTO_INCREMENT for table `schedule`
--
ALTER TABLE `schedule`
  MODIFY `scheduleid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;
--
-- AUTO_INCREMENT for table `schedulecomponent`
--
ALTER TABLE `schedulecomponent`
  MODIFY `schedulecomponentid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=146;
--
-- AUTO_INCREMENT for table `suntrigger`
--
ALTER TABLE `suntrigger`
  MODIFY `suntriggerid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `devicetrigger`
--
ALTER TABLE `devicetrigger`
  ADD CONSTRAINT `devicetrigger_ibfk_1` FOREIGN KEY (`deviceid`) REFERENCES `device` (`deviceid`),
  ADD CONSTRAINT `devicetrigger_ibfk_3` FOREIGN KEY (`propertyprofileid`) REFERENCES `propertyprofile` (`propertyprofileid`);

--
-- Constraints for table `history`
--
ALTER TABLE `history`
  ADD CONSTRAINT `history_ibfk_1` FOREIGN KEY (`propertyid`) REFERENCES `property` (`propertyid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `property`
--
ALTER TABLE `property`
  ADD CONSTRAINT `property_ibfk_1` FOREIGN KEY (`propertytypeid`) REFERENCES `propertytype` (`propertytypeid`);

--
-- Constraints for table `propertygroupcomponent`
--
ALTER TABLE `propertygroupcomponent`
  ADD CONSTRAINT `propertygroupcomponent_ibfk_1` FOREIGN KEY (`propertyid`) REFERENCES `property` (`propertyid`),
  ADD CONSTRAINT `propertygroupcomponent_ibfk_2` FOREIGN KEY (`propertygroupid`) REFERENCES `propertygroup` (`propertygroupid`);

--
-- Constraints for table `propertyprofile`
--
ALTER TABLE `propertyprofile`
  ADD CONSTRAINT `propertyprofile_ibfk_1` FOREIGN KEY (`propertygroupid`) REFERENCES `propertygroup` (`propertygroupid`),
  ADD CONSTRAINT `propertyprofile_ibfk_2` FOREIGN KEY (`propertysubgroupid`) REFERENCES `propertysubgroup` (`propertysubgroupid`);

--
-- Constraints for table `propertyprofilecomponent`
--
ALTER TABLE `propertyprofilecomponent`
  ADD CONSTRAINT `propertyprofilecomponent_ibfk_1` FOREIGN KEY (`propertyid`) REFERENCES `property` (`propertyid`),
  ADD CONSTRAINT `propertyprofilecomponent_ibfk_2` FOREIGN KEY (`propertyprofileid`) REFERENCES `propertyprofile` (`propertyprofileid`);

--
-- Constraints for table `propertysubgroup`
--
ALTER TABLE `propertysubgroup`
  ADD CONSTRAINT `propertysubgroup_ibfk_1` FOREIGN KEY (`propertygroupid`) REFERENCES `propertygroup` (`propertygroupid`);

--
-- Constraints for table `propertysubgroupcomponent`
--
ALTER TABLE `propertysubgroupcomponent`
  ADD CONSTRAINT `propertysubgroupcomponent_ibfk_1` FOREIGN KEY (`propertyid`) REFERENCES `property` (`propertyid`),
  ADD CONSTRAINT `propertysubgroupcomponent_ibfk_2` FOREIGN KEY (`propertysubgroupid`) REFERENCES `propertysubgroup` (`propertysubgroupid`);

--
-- Constraints for table `propertytrigger`
--
ALTER TABLE `propertytrigger`
  ADD CONSTRAINT `propertytrigger_ibfk_1` FOREIGN KEY (`propertyid`) REFERENCES `property` (`propertyid`),
  ADD CONSTRAINT `propertytrigger_ibfk_2` FOREIGN KEY (`propertyprofileid`) REFERENCES `propertyprofile` (`propertyprofileid`),
  ADD CONSTRAINT `propertytrigger_ibfk_3` FOREIGN KEY (`scheduleid`) REFERENCES `schedule` (`scheduleid`);

--
-- Constraints for table `schedulecomponent`
--
ALTER TABLE `schedulecomponent`
  ADD CONSTRAINT `schedulecomponent_ibfk_1` FOREIGN KEY (`scheduleid`) REFERENCES `schedule` (`scheduleid`);

--
-- Constraints for table `suntrigger`
--
ALTER TABLE `suntrigger`
  ADD CONSTRAINT `suntrigger_ibfk_2` FOREIGN KEY (`propertyprofileid`) REFERENCES `propertyprofile` (`propertyprofileid`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
